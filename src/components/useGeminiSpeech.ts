import { useCallback, useEffect, useRef, useState } from "react";
import { conversarComJuju } from "../lib/tutor-chat.functions";
import { jujuResponse } from "../lib/gemini-connection";
import {
  splitGeminiSpeech,
  type GeminiAudio,
  type GeminiVoiceSettings,
} from "../lib/gemini-voices";

export function useGeminiSpeech(profile?: string) {
  const context = useRef<AudioContext | null>(null);
  const job = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const player = useRef<{ source: AudioBufferSourceNode; finish: () => void } | null>(null);
  const cache = useRef(new Map<string, GeminiAudio>());
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);

  const unlock = useCallback(async () => {
    const Constructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw new Error("Este navegador não oferece reprodução da voz do Gemini.");
    if (!context.current || context.current.state === "closed") context.current = new Constructor();
    if (context.current.state === "suspended") await context.current.resume();
    if (context.current.state !== "running")
      throw new Error("Toque em Ouvir amostra para habilitar o áudio neste navegador.");
    return context.current;
  }, []);

  const stop = useCallback(() => {
    job.current++;
    abort.current?.abort();
    abort.current = null;
    const active = player.current;
    player.current = null;
    if (active) {
      try {
        active.source.stop();
      } catch {
        /* Already stopped. */
      }
      active.finish();
    }
    setGenerating(false);
    setPlaying(false);
  }, []);

  useEffect(() => {
    stop();
    cache.current.clear();
  }, [profile, stop]);
  useEffect(
    () => () => {
      stop();
      cache.current.clear();
      void context.current?.close();
      context.current = null;
    },
    [stop],
  );

  const speak = useCallback(
    async (text: string, settings: GeminiVoiceSettings) => {
      stop();
      const current = job.current;
      const controller = new AbortController();
      abort.current = controller;
      const chunks = splitGeminiSpeech(text);
      const load = (chunk: string) => {
        const key = JSON.stringify([settings, chunk]);
        const existing = cache.current.get(key);
        if (existing) return Promise.resolve(existing);
        const pending = conversarComJuju({
          signal: controller.signal,
          data: {
            acao: "speech",
            mensagem: chunk,
            voz: settings.voice,
            modeloVoz: settings.model,
            estiloVoz: settings.style,
            ritmoVoz: settings.pace,
          },
        }).then((result) => {
          jujuResponse(result);
          if (!result.ok || !result.audio)
            throw new Error("O Gemini não retornou áudio para esta fala.");
          if (controller.signal.aborted) throw new DOMException("Speech cancelled", "AbortError");
          cache.current.set(key, result.audio);
          while (cache.current.size > 6) cache.current.delete(cache.current.keys().next().value!);
          return result.audio;
        });
        return pending;
      };
      const outcome = async (chunk: string) => {
        try {
          return { ok: true as const, audio: await load(chunk) };
        } catch (error) {
          return { ok: false as const, error };
        }
      };
      try {
        const audioContext = await unlock();
        if (current !== job.current || !chunks.length) return;
        let pending = outcome(chunks[0]!);
        for (let i = 0; i < chunks.length; i++) {
          setGenerating(true);
          const result = await pending;
          if (current !== job.current) return;
          if (!result.ok) throw result.error;
          // Generate at most one following segment while the current segment plays.
          if (chunks[i + 1]) pending = outcome(chunks[i + 1]!);
          const raw = atob(result.audio.data);
          const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
          const buffer = await audioContext.decodeAudioData(bytes.buffer);
          if (current !== job.current) return;
          setGenerating(false);
          setPlaying(true);
          await new Promise<void>((resolve) => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            let ended = false;
            const finish = () => {
              if (ended) return;
              ended = true;
              source.disconnect();
              if (player.current?.source === source) player.current = null;
              resolve();
            };
            player.current = { source, finish };
            source.onended = finish;
            source.start();
          });
          if (current !== job.current) return;
          setPlaying(false);
        }
      } catch (error) {
        if (current === job.current) {
          const active = player.current;
          if (active) {
            try {
              active.source.stop();
            } catch {
              /* Already stopped. */
            }
            active.finish();
          }
          throw error;
        }
      } finally {
        if (current === job.current) {
          controller.abort();
          abort.current = null;
          setGenerating(false);
          setPlaying(false);
        }
      }
    },
    [stop, unlock],
  );
  return { unlock, stop, speak, generating, playing };
}
