import { createOpenAI } from "@ai-sdk/openai";

/** Resolve the configured OpenAI-compatible model only when a server function runs. */
export function getConfiguredAiModel() {
  const apiKey = process.env["AI_API_KEY"];
  const baseURL = process.env["AI_BASE_URL"];
  const modelId = process.env["AI_MODEL"];

  if (!apiKey || !baseURL || !modelId) {
    const missing = [
      ...(!apiKey ? ["AI_API_KEY"] : []),
      ...(!baseURL ? ["AI_BASE_URL"] : []),
      ...(!modelId ? ["AI_MODEL"] : []),
    ];
    throw new Error(`Configure as variáveis de IA no servidor: ${missing.join(", ")}.`);
  }

  return createOpenAI({ apiKey, baseURL }).chat(modelId);
}

/** Chat and mascot interactions always use Gemini; exam scoring keeps its own configuration. */
export function getGeminiChatModel() {
  const apiKey =
    process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"] || process.env["AI_API_KEY"];
  if (!apiKey)
    throw new Error(
      "Configure a chave do Google AI Studio como secret AI_API_KEY ou GEMINI_API_KEY no Cloudflare e publique a alteração.",
    );
  const configured = process.env["GEMINI_MODEL"] || process.env["AI_MODEL"];
  const modelId = configured?.startsWith("gemini-") ? configured : "gemini-3.8-flash";
  return createOpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  }).chat(modelId);
}
