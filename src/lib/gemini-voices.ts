export const GEMINI_VOICE_IDS = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
] as const;
export type GeminiVoice = (typeof GEMINI_VOICE_IDS)[number];
export const GEMINI_VOICE_LABELS = [
  "Brilhante",
  "Animada",
  "Informativa",
  "Firme",
  "Entusiasmada",
  "Jovem",
  "Firme",
  "Leve",
  "Descontraída",
  "Brilhante",
  "Sussurrada",
  "Clara",
  "Tranquila",
  "Suave",
  "Suave",
  "Clara",
  "Rouca",
  "Informativa",
  "Alegre",
  "Delicada",
  "Firme",
  "Equilibrada",
  "Madura",
  "Expressiva",
  "Amigável",
  "Casual",
  "Gentil",
  "Vivaz",
  "Sábia",
  "Acolhedora",
];
export const GEMINI_TTS_MODELS = {
  fast: "gemini-3.8-flash-lite-tts",
  quality: "gemini-3.8-flash-tts",
} as const;
export const GEMINI_STYLES = {
  warm: "Acolhedor",
  calm: "Calmo",
  bright: "Animado",
  neutral: "Neutro",
} as const;
export const GEMINI_PACES = {
  normal: "Normal",
  slow: "Mais devagar",
  fast: "Mais rápido",
} as const;
export interface GeminiVoiceSettings {
  voice: GeminiVoice;
  model: keyof typeof GEMINI_TTS_MODELS;
  style: keyof typeof GEMINI_STYLES;
  pace: keyof typeof GEMINI_PACES;
}
export type GeminiAudio = { data: string; mimeType: "audio/wav" };
export const DEFAULT_GEMINI_VOICE: GeminiVoiceSettings = {
  voice: "Sulafat",
  model: "fast",
  style: "warm",
  pace: "normal",
};
export function restoreGeminiVoice(value: unknown): GeminiVoiceSettings {
  const v = value && typeof value === "object" ? (value as Partial<GeminiVoiceSettings>) : {};
  return {
    voice: GEMINI_VOICE_IDS.includes(v.voice as GeminiVoice)
      ? v.voice!
      : DEFAULT_GEMINI_VOICE.voice,
    model: v.model === "quality" ? "quality" : "fast",
    style: v.style && Object.hasOwn(GEMINI_STYLES, v.style) ? v.style : DEFAULT_GEMINI_VOICE.style,
    pace: v.pace && Object.hasOwn(GEMINI_PACES, v.pace) ? v.pace : DEFAULT_GEMINI_VOICE.pace,
  };
}

/** A short first segment improves time to the first spoken words. Preserve all text. */
export function splitGeminiSpeech(text: string): string[] {
  let rest = text.trim();
  const chunks: string[] = [];
  while (rest) {
    const max = chunks.length === 0 ? 280 : 850;
    if (rest.length <= max) {
      chunks.push(rest);
      break;
    }
    const prefix = rest.slice(0, max + 1);
    const sentences = [...prefix.matchAll(/[.!?…]\s+/g)];
    const last = sentences.at(-1);
    const boundary =
      last && last.index! > max / 3
        ? last.index! + last[0].length
        : Math.max(prefix.lastIndexOf(" "), prefix.lastIndexOf("\n"));
    const cut = boundary > max / 3 ? boundary : max;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return chunks;
}
