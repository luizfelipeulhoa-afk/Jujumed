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
