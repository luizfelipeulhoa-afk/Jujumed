import { MSG_GEMINI_AUSENTE, MSG_GEMINI_COTA, MSG_TRANSCRICAO_CONEXAO } from "./estudo-mensagens";

export const FOCOS_ESTUDO = ["geral", "biologia", "quimica", "redacao"] as const;
export type FocoEstudo = (typeof FOCOS_ESTUDO)[number];

export const ROTULOS_FOCO: Record<FocoEstudo, string> = {
  geral: "Geral",
  biologia: "Biologia",
  quimica: "Química",
  redacao: "Redação",
};

/** Gemini free tier accepts a longer study note than the Groq quiz quota. */
export const LIMITE_RESUMO = 12_000;
export const LIMITE_QUIZ = 6_000;
export const MIN_TEXTO_ESTUDO = 40;
export const LIMITE_AUDIO_BYTES = 18 * 1024 * 1024;
export const RASCUNHO_ESTUDO_KEY = "jujumed-estudo-texto";

export interface QuestaoQuiz {
  enunciado: string;
  alternativas: [string, string, string, string];
  correta: 0 | 1 | 2 | 3;
  explicacao: string;
}

export interface QuizGerado {
  titulo: string;
  questoes: QuestaoQuiz[];
}

export type CodigoFalhaEstudo =
  | "missing_key"
  | "invalid_key"
  | "quota"
  | "timeout"
  | "unavailable"
  | "empty"
  | "formato"
  | "arquivo"
  | "connection";

export interface FalhaEstudo {
  ok: false;
  code: CodigoFalhaEstudo;
  message: string;
}

export type ResultadoResumo = { ok: true; resumo: string; recortado: boolean } | FalhaEstudo;
export type ResultadoQuiz = { ok: true; quiz: QuizGerado; recortado: boolean } | FalhaEstudo;
export type ResultadoTranscricao = { ok: true; texto: string } | FalhaEstudo;

export function recortarTexto(texto: string, limite: number) {
  const limpo = texto.trim();
  if (limpo.length <= limite) return { texto: limpo, recortado: false };
  return { texto: limpo.slice(0, limite), recortado: true };
}

export function guardarRascunhoEstudo(texto: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(RASCUNHO_ESTUDO_KEY, texto.slice(0, 20_000));
}

export function lerRascunhoEstudo() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(RASCUNHO_ESTUDO_KEY) ?? "";
}

const CODIGOS_FALHA = [
  "missing_key",
  "invalid_key",
  "quota",
  "timeout",
  "unavailable",
  "empty",
  "formato",
  "arquivo",
  "connection",
] as const;

export function traduzirFalhaGemini(code: string, message: string): FalhaEstudo {
  if (code === "missing_key")
    return { ok: false, code: "missing_key", message: MSG_GEMINI_AUSENTE };
  if (code === "quota") return { ok: false, code: "quota", message: MSG_GEMINI_COTA };
  if (code === "invalid_key") return { ok: false, code: "invalid_key", message };
  if (code === "timeout") return { ok: false, code: "timeout", message };
  if (code === "empty_response") return { ok: false, code: "empty", message };
  if (code === "connection") return { ok: false, code: "connection", message };
  return { ok: false, code: "unavailable", message };
}

export function lerResultadoTranscricao(payload: unknown): ResultadoTranscricao {
  if (!payload || typeof payload !== "object") {
    return { ok: false, code: "connection", message: MSG_TRANSCRICAO_CONEXAO };
  }
  const registro = payload as Record<string, unknown>;
  if (
    registro["ok"] === true &&
    typeof registro["texto"] === "string" &&
    registro["texto"].trim()
  ) {
    return { ok: true, texto: registro["texto"].trim() };
  }
  if (registro["ok"] === false && typeof registro["message"] === "string" && registro["message"]) {
    const codigo = CODIGOS_FALHA.find((item) => item === registro["code"]) ?? "connection";
    return { ok: false, code: codigo, message: registro["message"] };
  }
  return { ok: false, code: "connection", message: MSG_TRANSCRICAO_CONEXAO };
}

const EXTENSOES = new Set([
  ".flac",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".m4a",
  ".ogg",
  ".wav",
  ".webm",
]);

const TIPOS_AUDIO: Record<string, string> = {
  "audio/webm": ".webm",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/mp4": ".m4a",
  "audio/m4a": ".m4a",
  "audio/x-m4a": ".m4a",
  "video/mp4": ".mp4",
  "audio/ogg": ".ogg",
  "application/ogg": ".ogg",
  "audio/flac": ".flac",
  "audio/x-flac": ".flac",
};

/** Returns a safe filename extension, or null when the upload is not lecture audio. */
export function extensaoAudio(nome: string, tipo: string): string | null {
  const normalizado = tipo.split(";")[0]?.trim().toLowerCase() ?? "";
  const peloTipo = TIPOS_AUDIO[normalizado];
  if (peloTipo) return peloTipo;
  const match = /\.(flac|mp3|mp4|mpeg|mpga|m4a|ogg|wav|webm)$/i.exec(nome.trim());
  const extensao = match?.[0]?.toLowerCase();
  return extensao && EXTENSOES.has(extensao) ? extensao : null;
}
