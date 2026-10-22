import { test } from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { generateGeminiSpeech, googleAudioToWav } from "./gemini-speech.server";
import {
  DEFAULT_GEMINI_VOICE,
  GEMINI_VOICE_IDS,
  restoreGeminiVoice,
  splitGeminiSpeech,
} from "./gemini-voices";
import { geminiFailure } from "./gemini-connection";

test("WAV output is preserved and raw PCM is wrapped exactly once", () => {
  const pcm = Buffer.from([0, 0, 255, 127, 0, 128]);
  const converted = googleAudioToWav(pcm.toString("base64"), "audio/l16;codec=pcm;rate=24000");
  const wav = Buffer.from(converted.data, "base64");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
  assert.equal(googleAudioToWav(converted.data, "audio/wav").data, converted.data);
  assert.throws(() => googleAudioToWav("", "audio/wav"));
  assert.throws(() => googleAudioToWav(pcm.toString("base64"), "text/plain"));
});

test("all preset voices and safe stored preferences work; long speech preserves text", () => {
  assert.equal(new Set(GEMINI_VOICE_IDS).size, 30);
  assert.deepEqual(
    restoreGeminiVoice({
      voice: "browser voice",
      model: "https://example.com",
      style: "__proto__",
    }),
    DEFAULT_GEMINI_VOICE,
  );
  assert.deepEqual(
    restoreGeminiVoice({ voice: "Kore", model: "quality", style: "calm", pace: "slow" }),
    { voice: "Kore", model: "quality", style: "calm", pace: "slow" },
  );
  const text = Array.from({ length: 100 }, (_, i) => `Frase ${i}: você consegue, Ju!`).join(" ");
  const chunks = splitGeminiSpeech(text);
  assert.ok(chunks.length > 2);
  assert.ok(chunks[0]!.length <= 281);
  assert.ok(chunks.every((chunk) => chunk.length <= 1000));
  assert.equal(chunks.join(" ").replace(/\s+/g, " "), text);
  assert.deepEqual(splitGeminiSpeech("  "), []);
});

test("Google TTS uses the selected real model and voice, with delivery outside the transcript", async () => {
  const keys = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_API_KEY"];
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const wav = googleAudioToWav(
    Buffer.from([0, 0, 1, 0]).toString("base64"),
    "audio/l16;rate=24000",
  );
  try {
    keys.forEach((key) => delete process.env[key]);
    process.env["AI_API_KEY"] = "test-speech-key";
    for (const model of ["fast", "quality"] as const) {
      globalThis.fetch = async (url, init) => {
        assert.ok(
          String(url).endsWith(
            `${model === "fast" ? "gemini-3.8-flash-lite-tts" : "gemini-3.8-flash-tts"}:generateContent`,
          ),
        );
        assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-speech-key");
        assert.ok(!String(url).includes("test-speech-key"));
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(body.generationConfig.responseModalities, ["AUDIO"]);
        assert.deepEqual(body.generationConfig.speechConfig.voiceConfig, { voice: "Kore" });
        assert.equal(body.contents[0].parts[0].text, "Bom dia, Ju!");
        assert.match(body.contents[0].parts[0].speech_metadata.style, /Português do Brasil/);
        return Response.json({ candidates: [{ content: { parts: [{ inlineData: wav }] } }] });
      };
      const result = await generateGeminiSpeech("Bom dia, Ju!", {
        voice: "Kore",
        model,
        style: "calm",
        pace: "slow",
      });
      assert.deepEqual(result, wav);
    }
    globalThis.fetch = async () =>
      Response.json({ error: { code: 429, message: "Quota exhausted" } }, { status: 429 });
    await assert.rejects(
      generateGeminiSpeech("Oi", DEFAULT_GEMINI_VOICE),
      (error) => geminiFailure(error).code === "quota",
    );
    globalThis.fetch = async () => Response.json({ candidates: [] });
    await assert.rejects(generateGeminiSpeech("Oi", DEFAULT_GEMINI_VOICE), /não retornou áudio/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
});
