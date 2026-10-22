import { GeminiConfigurationError, GeminiEmptyResponseError } from "./gemini-connection";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const CHAT_MODEL = "gemini-3.8-flash";
type Message = { role: "system" | "user" | "assistant"; content: string };
type GoogleResponse = {
  error?: { message?: string; status?: string };
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { thoughtsTokenCount?: number; candidatesTokenCount?: number };
};

type Diagnostic = {
  id: string;
  model: string;
  attempt: number;
  elapsedMs: number;
  http?: number | undefined;
  finish?: string | undefined;
  kind: string;
};
const diagnostics = new WeakMap<object, Diagnostic>();
export function geminiDiagnostic(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return;
  const d = diagnostics.get(error);
  if (!d) return;
  return `Referência: ${d.id}\nModelo: ${d.model}\nTipo: ${d.kind}${d.http ? ` · HTTP ${d.http}` : ""}${d.finish ? ` · Finalização ${d.finish}` : ""}\nTentativa: ${d.attempt} · Tempo: ${(d.elapsedMs / 1000).toFixed(1)} s`;
}

export class GeminiHttpError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: string,
  ) {
    super(`Gemini HTTP ${statusCode}`);
    this.name = "GeminiHttpError";
  }
}

export function getGeminiSettings() {
  const key =
    process.env["GEMINI_API_KEY"]?.trim() ||
    process.env["GOOGLE_API_KEY"]?.trim() ||
    process.env["AI_API_KEY"]?.trim();
  if (!key) throw new GeminiConfigurationError();
  // This companion is pinned to the model explicitly requested by the owner.
  return { key, model: CHAT_MODEL };
}

export async function generateGeminiReply(messages: Message[]): Promise<string> {
  const { key, model } = getGeminiSettings();
  const deadline = AbortSignal.timeout(65000);
  const startedAt = Date.now();
  const id = crypto.randomUUID();
  let activeModel = model,
    activeAttempt = 1;
  function annotate(error: unknown, kind: string, http?: number, finish?: string) {
    if (error && typeof error === "object")
      diagnostics.set(error, {
        id,
        model: activeModel,
        attempt: activeAttempt,
        elapsedMs: Date.now() - startedAt,
        kind,
        http,
        finish,
      });
    return error;
  }
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const message of messages) {
    if (message.role === "system" || !message.content.trim()) continue;
    const role = message.role === "assistant" ? "model" : "user";
    const last = contents.at(-1);
    if (last?.role === role) last.parts.push({ text: message.content });
    else contents.push({ role, parts: [{ text: message.content }] });
  }
  // Gemini expects a user turn first. The UI may include an automatic greeting before it.
  while (contents[0]?.role === "model") contents.shift();

  async function request(path: string, body?: object): Promise<GoogleResponse> {
    for (let attempt = 0; attempt < 2; attempt++) {
      activeAttempt = attempt + 1;
      try {
        const response = await fetch(`${BASE}/${path}`, {
          method: body ? "POST" : "GET",
          headers: {
            "x-goog-api-key": key,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.any([deadline, AbortSignal.timeout(30000)]),
        });
        const text = await response.text();
        if (!response.ok) throw new GeminiHttpError(response.status, text);
        try {
          return JSON.parse(text) as GoogleResponse;
        } catch {
          throw new GeminiHttpError(502, "Invalid JSON response from Gemini");
        }
      } catch (error) {
        const temporary =
          error instanceof GeminiHttpError
            ? [408, 500, 502, 503, 504].includes(error.statusCode)
            : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
        if (attempt === 1 || !temporary || deadline.aborted)
          throw annotate(
            error,
            error instanceof GeminiHttpError
              ? "google_http"
              : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
                ? "timeout"
                : "network",
            error instanceof GeminiHttpError ? error.statusCode : undefined,
          );
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 250));
      }
    }
    throw new GeminiHttpError(503, "Retry budget exhausted");
  }
  async function generate(selected: string, outputTokens = 4096) {
    activeModel = selected;
    const thinkingConfig = /^gemini-3[.-]/.test(selected)
      ? {
          thinkingLevel:
            /^gemini-3\.(1|5|6).*flash/.test(selected) || /^gemini-3-flash/.test(selected)
              ? "minimal"
              : "low",
        }
      : /^gemini-2\.5-flash/.test(selected)
        ? { thinkingBudget: 0 }
        : undefined;
    return request(`models/${encodeURIComponent(selected)}:generateContent`, {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: outputTokens,
        ...(thinkingConfig ? { thinkingConfig } : {}),
      },
    });
  }
  let result = await generate(model);
  const answerText = (response: GoogleResponse) =>
    response.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  let text = answerText(result);
  if (!text && result.candidates?.[0]?.finishReason === "MAX_TOKENS" && !deadline.aborted) {
    // Thought tokens share the output budget. Retry once with room for visible text.
    result = await generate(activeModel, 8192);
    text = answerText(result);
  }
  if (text) return text;
  if (result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason === "SAFETY")
    return "Não consegui responder a esse pedido. Pode reformular a pergunta?";
  const finish = result.candidates?.[0]?.finishReason;
  throw annotate(
    new GeminiEmptyResponseError(finish ?? "NO_CANDIDATE"),
    "empty_response",
    undefined,
    finish,
  );
}
