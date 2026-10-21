import { useEffect, useRef, useState } from "react";

/** Mounted only for Ju's profile; navigating between study views keeps playback intact. */
export default function JuWelcomeMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(40);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let active = true;
    audio.volume = 0.4;
    void audio.play().catch((error: unknown) => {
      if (!active) return;
      setNotice(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Toque em Tocar para ouvir sua música."
          : "Toque em Tocar para tentar iniciar a música.",
      );
    });
    return () => {
      active = false;
      audio.pause();
    };
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    setNotice("");
    try {
      await audio.play();
    } catch {
      setNotice("Não foi possível tocar agora. Tente novamente.");
    }
  }

  function close() {
    audioRef.current?.pause();
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <aside
      aria-label="Música de boas-vindas da Ju"
      className="fixed bottom-4 left-3 z-[60] w-[min(280px,calc(100vw-160px))] rounded-2xl border border-[#d4a574]/40 bg-[#17251f]/95 p-3 text-[#f6e7ce] shadow-xl backdrop-blur"
    >
      <audio
        ref={audioRef}
        src="/audio/ju-welcome.mp3"
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPosition(45);
        }}
        onTimeUpdate={(event) => setPosition(Math.min(45, event.currentTarget.currentTime))}
        onError={() => {
          setPlaying(false);
          setNotice("A música não carregou. Confira sua conexão.");
        }}
      />
      <div className="mb-2 flex items-center justify-between gap-1">
        <span className="text-xs font-semibold">Sua música, Ju ♫</span>
        <button
          type="button"
          onClick={close}
          aria-label="Parar e fechar música"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d4a574]"
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={() => void togglePlayback()}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a574] px-2 text-sm font-bold text-[#17251f] hover:bg-[#e1bb8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={
          playing
            ? "Pausar música"
            : position >= 45
              ? "Ouvir música de novo"
              : position > 0
                ? "Continuar música"
                : "Tocar música"
        }
      >
        <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
        {playing
          ? "Pausar"
          : position >= 45
            ? "Ouvir de novo"
            : position > 0
              ? "Continuar"
              : "Tocar"}
      </button>
      <div className="mt-2 flex items-center gap-2">
        <progress
          value={position}
          max={45}
          aria-label="Progresso da música"
          className="h-1 w-full accent-[#d4a574]"
        />
        <span className="shrink-0 text-[10px] tabular-nums">
          0:{String(Math.floor(position)).padStart(2, "0")} / 0:45
        </span>
      </div>
      <label className="mt-2 flex items-center gap-2 text-[10px]">
        Volume
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          aria-label="Volume da música"
          className="min-w-0 flex-1 accent-[#d4a574]"
          onChange={(event) => {
            const value = Number(event.target.value);
            setVolume(value);
            if (audioRef.current) audioRef.current.volume = value / 100;
          }}
        />
      </label>
      {notice && (
        <p role="status" className="mt-2 text-[11px] leading-snug">
          {notice}
        </p>
      )}
    </aside>
  );
}
