import { Buffer } from "node:buffer";
import { GeminiAudioError } from "./gemini-connection";
import { getGeminiSettings, GeminiHttpError } from "./gemini-native.server";
import { GEMINI_TTS_MODELS, type GeminiAudio, type GeminiVoiceSettings } from "./gemini-voices";

export function googleAudioToWav(data: string, mimeType: string): GeminiAudio {
  const bytes = Buffer.from(data, "base64");
  if (bytes.length < 2 || bytes.length > 6 * 1024 * 1024)
    throw new GeminiAudioError("O Gemini retornou um áudio vazio ou grande demais.");
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE")
    return { data: bytes.toString("base64"), mimeType: "audio/wav" };
  if (!/^audio\/(l16|pcm)/i.test(mimeType) || bytes.length % 2 !== 0)
    throw new GeminiAudioError("O Gemini retornou um formato de áudio inesperado.");
  const rate = Number(mimeType.match(/rate=(\d+)/i)?.[1] ?? 24000);
  if (rate < 8000 || rate > 96000)
    throw new GeminiAudioError("O Gemini retornou uma taxa de áudio inválida.");
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + bytes.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(bytes.length, 40);
  return { data: Buffer.concat([header, bytes]).toString("base64"), mimeType: "audio/wav" };
}

export async function generateGeminiSpeech(
  text: string,
  settings: GeminiVoiceSettings,
  signal?: AbortSignal,
): Promise<GeminiAudio> {
  const { key } = getGeminiSettings();
  const model = GEMINI_TTS_MODELS[settings.model];
  const styles = {
    warm: "Tom acolhedor, carinhoso e natural.",
    calm: "Tom calmo e sereno.",
    bright: "Tom alegre e animado.",
    neutral: "Tom neutro e claro.",
  };
  const paces = {
    normal: "Ritmo natural de conversa.",
    slow: "Fale um pouco mais devagar, com pausas curtas.",
    fast: "Fale um pouco mais rápido, com clareza.",
  };
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(40000)])
        : AbortSignal.timeout(40000),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text,
                speech_metadata: {
                  style: `Português do Brasil. ${styles[settings.style]} ${paces[settings.pace]}`,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { voice: settings.voice } },
        },
      }),
    },
  );
  const raw = await response.text();
  if (!response.ok) throw new GeminiHttpError(response.status, raw);
  const result = JSON.parse(raw) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
  };
  const audio = result.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData;
  if (!audio?.data)
    throw new GeminiAudioError(
      "O Gemini respondeu, mas não retornou áudio. Confira o acesso ao modelo de voz no Google AI Studio.",
    );
  return googleAudioToWav(audio.data, audio.mimeType ?? "audio/wav");
}
