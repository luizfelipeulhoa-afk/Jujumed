import { GeminiConfigurationError } from "./gemini-connection";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.8-flash";
type Message = { role: "system" | "user" | "assistant"; content: string };
type ModelInfo = { name?: string; supportedGenerationMethods?: string[] };
type GoogleResponse = {
  error?: { message?: string; status?: string };
  models?: ModelInfo[];
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

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
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.AI_API_KEY?.trim();
  if (!key) throw new GeminiConfigurationError();
  const configured = (process.env.GEMINI_MODEL?.trim() || process.env.AI_MODEL?.trim())?.replace(
    /^models\//,
    "",
  );
  const model = configured?.startsWith("gemini-") ? configured : DEFAULT_MODEL;
  if (!/^gemini-[a-zA-Z0-9._-]+$/.test(model)) throw new GeminiHttpError(404, "Invalid model name");
  return { key, model, explicitModel: Boolean(configured?.startsWith("gemini-")) };
}

// A discovered fallback is scoped to the same key and requested default, on the server only.
let fallback: { key: string; model: string; expires: number } | undefined;

export async function generateGeminiReply(messages: Message[]): Promise<string> {
  const { key, model, explicitModel } = getGeminiSettings();
  const signal = AbortSignal.timeout(30000);
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
    const response = await fetch(`${BASE}/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "x-goog-api-key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    });
    const text = await response.text();
    if (!response.ok) throw new GeminiHttpError(response.status, text);
    try {
      return JSON.parse(text) as GoogleResponse;
    } catch {
      throw new GeminiHttpError(502, "Invalid JSON response from Gemini");
    }
  }
  async function generate(selected: string) {
    const thinkingConfig = /^gemini-3[.-]/.test(selected)
      ? { thinkingLevel: "low" }
      : /^gemini-2\.5-flash/.test(selected)
        ? { thinkingBudget: 512 }
        : undefined;
    return request(`models/${encodeURIComponent(selected)}:generateContent`, {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 4096, ...(thinkingConfig ? { thinkingConfig } : {}) },
    });
  }
  const selected =
    !explicitModel && fallback?.key === key && fallback.expires > Date.now()
      ? fallback.model
      : model;
  let result: GoogleResponse;
  try {
    result = await generate(selected);
  } catch (error) {
    if (!(error instanceof GeminiHttpError) || error.statusCode !== 404 || explicitModel)
      throw error;
    const available = await request("models?pageSize=1000");
    const names = (available.models ?? [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes("generateContent") &&
          /^models\/gemini-[a-zA-Z0-9._-]*flash[a-zA-Z0-9._-]*$/.test(m.name ?? "") &&
          !/image|tts|audio|live|robotics|computer-use/.test(m.name ?? ""),
      )
      .map((m) => m.name!.replace(/^models\//, ""));
    // Prefer a stable general-purpose Flash model from the list Google actually returned.
    const alternative =
      names.find((name) => !/preview|exp|lite/.test(name)) ??
      names.find((name) => !/preview|exp/.test(name)) ??
      names[0];
    if (!alternative || alternative === selected) throw error;
    result = await generate(alternative);
    fallback = { key, model: alternative, expires: Date.now() + 15 * 60 * 1000 };
  }
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (text) return text;
  if (result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason === "SAFETY")
    return "Não consegui responder a esse pedido. Pode reformular a pergunta?";
  throw new GeminiHttpError(502, "Gemini returned no answer text");
}
