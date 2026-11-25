import { GeminiConfigurationError, GeminiEmptyResponseError } from "./gemini-connection";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const CHAT_MODEL = "gemini-3.8-flash";
const CHAT_TIMEOUT_MS = 28000;
const ATTEMPT_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 3;
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
  const deadline = AbortSignal.timeout(CHAT_TIMEOUT_MS);
  const startedAt = Date.now();
  const id = crypto.randomUUID();
  let activeAttempt = 1;
  function annotate(error: unknown, kind: string, http?: number, finish?: string) {
    if (error && typeof error === "object")
      diagnostics.set(error, {
        id,
        model,
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
  // The current user message follows the local greeting, which Gemini does not need.
  while (contents[0]?.role === "model") contents.shift();

  async function request(body: object): Promise<GoogleResponse> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      activeAttempt = attempt + 1;
      try {
        const response = await fetch(`${BASE}/models/${model}:generateContent`, {
          method: "POST",
          headers: {
            "x-goog-api-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.any([deadline, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)]),
        });
        const text = await response.text();
        if (!response.ok) throw new GeminiHttpError(response.status, text);
        try {
          return JSON.parse(text) as GoogleResponse;
        } catch {
          throw new GeminiHttpError(502, "Invalid JSON response from Gemini");
        }
      } catch (error) {
        const timeout =
          error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
        const temporary =
          error instanceof GeminiHttpError
            ? [408, 500, 502, 503, 504].includes(error.statusCode)
            : timeout || error instanceof TypeError;
        const backoffMs = 500 * 2 ** attempt + Math.random() * 250;
        if (
          activeAttempt === MAX_ATTEMPTS ||
          !temporary ||
          deadline.aborted ||
          Date.now() - startedAt + backoffMs >= CHAT_TIMEOUT_MS
        )
          throw annotate(
            error,
            error instanceof GeminiHttpError ? "google_http" : timeout ? "timeout" : "network",
            error instanceof GeminiHttpError ? error.statusCode : undefined,
          );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    throw new GeminiHttpError(503, "Retry budget exhausted");
  }
  function generate(outputTokens = 4096) {
    return request({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        maxOutputTokens: outputTokens,
        thinkingConfig: { thinkingLevel: "low" },
      },
    });
  }
  let result = await generate();
  const answerText = (response: GoogleResponse) =>
    response.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  let text = answerText(result);
  if (!text && result.candidates?.[0]?.finishReason === "MAX_TOKENS" && !deadline.aborted) {
    // Thought tokens share the output budget. Retry once with room for visible text.
    result = await generate(8192);
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
