import { notifyMascot } from "../lib/mascot-events";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import BearMascot from "./BearMascot";
import DraggableMascot from "./DraggableMascot";
import "./bear-mascot.css";
import { useGeminiSpeech } from "./useGeminiSpeech";
import {
  DEFAULT_GEMINI_VOICE,
  GEMINI_VOICE_IDS,
  GEMINI_VOICE_LABELS,
  GEMINI_STYLES,
  GEMINI_PACES,
  restoreGeminiVoice,
  type GeminiVoiceSettings,
} from "../lib/gemini-voices";
import type { Questao2027 } from "../data/exame2027";
import { conversarComJuju } from "../lib/tutor-chat.functions";
import { jujuResponse, JujuConnectionError } from "../lib/gemini-connection";

interface Props {
  perfilId?: string;
  questaoAtiva: Questao2027 | null;
  abertoExternamente: boolean;
  onFecharExterno: () => void;
  perguntaInicial: string | null;
  onLimparPerguntaInicial: () => void;
}

interface Mensagem {
  id: number;
  autor: "jujubot" | "voce";
  texto: string;
  erro?: boolean;
  pendente?: boolean;
  diagnostic?: string | undefined;
}

interface ResultadoReconhecimento {
  isFinal: boolean;
  0: { transcript: string };
}

interface EventoReconhecimento {
  resultIndex: number;
  results: ArrayLike<ResultadoReconhecimento>;
}

interface ReconhecedorVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: EventoReconhecimento) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type JanelaComVoz = Window & {
  SpeechRecognition?: new () => ReconhecedorVoz;
  webkitSpeechRecognition?: new () => ReconhecedorVoz;
};

let proximoId = 1;

function contextoDoUrso() {
  const hora = new Date().getHours();

  let nome = "Jujuba";
  try {
    const id = localStorage.getItem("tutor-uerj-perfil-ativo");
    const perfis: unknown = JSON.parse(localStorage.getItem("tutor-uerj-perfis") || "[]");
    if (Array.isArray(perfis)) {
      const perfil = perfis.find((item) => item && item.id === id);
      if (typeof perfil?.nome === "string") nome = perfil.nome.split(" ")[0] || nome;
    }
  } catch {
    /* A saudação também funciona sem armazenamento local. */
  }
  return { horaLocal: hora, nome: nome.slice(0, 80) };
}

export default function TutorBot({
  perfilId,
  questaoAtiva,
  abertoExternamente,
  onFecharExterno,
  perguntaInicial,
  onLimparPerguntaInicial,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [saudacao, setSaudacao] = useState(
    "O Totem da sabedoria está preparando uma saudação para você…",
  );
  const [mostrarSaudacao, setMostrarSaudacao] = useState(true);
  const [recadoFechado, setRecadoFechado] = useState(false);
  const mostrarRecado = perfilId === "jujuba" && !recadoFechado;
  useEffect(() => {
    setRecadoFechado(false);
  }, [perfilId]);
  const [gesto, setGesto] = useState<"idle" | "wave" | "stethoscope" | "breathe">("wave");
  const saudacaoPromiseRef = useRef<Promise<string> | null>(null);
  const painelAbertoRef = useRef(false);
  const gestoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animar = useCallback((acao: "wave" | "stethoscope" | "breathe") => {
    if (gestoTimer.current) clearTimeout(gestoTimer.current);
    setGesto(acao);
    gestoTimer.current = setTimeout(() => setGesto("idle"), acao === "breathe" ? 16000 : 5000);
  }, []);

  useEffect(() => {
    let ativo = true;
    animar("wave");
    saudacaoPromiseRef.current ??= conversarComJuju({
      data: { mensagem: "", acao: "greeting", ...contextoDoUrso() },
    }).then(jujuResponse);
    void saudacaoPromiseRef.current
      .then((resposta) => {
        if (!ativo) return;
        setSaudacao(resposta);
        setMensagens((atuais) =>
          atuais.map((item) =>
            item.id === 0 ? { ...item, texto: resposta, erro: false, pendente: false } : item,
          ),
        );
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        const aviso =
          error instanceof Error
            ? error.message
            : "Não consegui conectar ao Gemini agora. Toque no urso para tentar novamente.";
        setSaudacao(aviso);
        setMensagens((atuais) =>
          atuais.map((item) =>
            item.id === 0
              ? {
                  ...item,
                  texto: aviso,
                  erro: true,
                  pendente: false,
                  diagnostic: error instanceof JujuConnectionError ? error.diagnostic : undefined,
                }
              : item,
          ),
        );
        saudacaoPromiseRef.current = null;
      });
    const timer = setTimeout(() => setMostrarSaudacao(false), 30000);
    return () => {
      ativo = false;
      clearTimeout(timer);
      if (gestoTimer.current) clearTimeout(gestoTimer.current);
    };
  }, [animar]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 0,
      autor: "jujubot",
      texto: "O Totem da sabedoria está preparando uma saudação para você…",
      erro: true,
      pendente: true,
    },
  ]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [falando, setFalando] = useState(false);
  const [avisoVoz, setAvisoVoz] = useState("");
  const [vozDisponivel, setVozDisponivel] = useState(false);
  const [sinteseDisponivel, setSinteseDisponivel] = useState(false);
  const [vozGemini, setVozGemini] = useState<GeminiVoiceSettings>(DEFAULT_GEMINI_VOICE);
  const vozGeminiRef = useRef<GeminiVoiceSettings>(DEFAULT_GEMINI_VOICE);
  const falaJobRef = useRef(0);
  const geminiSpeech = useGeminiSpeech(perfilId);
  const [lerRespostas, setLerRespostas] = useState(true);
  const lerRespostasRef = useRef(true);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const reconhecedorRef = useRef<ReconhecedorVoz | null>(null);
  const vozAtivaRef = useRef(false);
  const trabalhandoRef = useRef(false);
  const falandoRef = useRef(false);
  const [vozAtiva, setVozAtiva] = useState(false);
  const questaoAtivaIdRef = useRef<string | undefined>(questaoAtiva?.id);
  const enviarMensagemRef = useRef<(mensagem: string, veioDaVoz?: boolean) => Promise<void>>(
    async () => {},
  );
  const perguntaInicialEnviadaRef = useRef<string | null>(null);

  const estaAberto = aberto || abertoExternamente;

  useEffect(() => {
    falaJobRef.current++;
    vozAtivaRef.current = false;
    setVozAtiva(false);
    falandoRef.current = false;
    setFalando(false);
    const reconhecedor = reconhecedorRef.current;
    reconhecedorRef.current = null;
    reconhecedor?.abort();
    setOuvindo(false);
    let settings = DEFAULT_GEMINI_VOICE;
    try {
      settings = restoreGeminiVoice(
        JSON.parse(localStorage.getItem(`totem-gemini-voice:${perfilId ?? "visitante"}`) ?? "null"),
      );
    } catch {
      /* Storage is optional. */
    }
    vozGeminiRef.current = settings;
    setVozGemini(settings);
    let read = true;
    try {
      read = localStorage.getItem(`totem-gemini-read:${perfilId ?? "visitante"}`) !== "false";
    } catch {
      /* Storage is optional. */
    }
    lerRespostasRef.current = read;
    setLerRespostas(read);
  }, [perfilId]);

  useEffect(() => {
    const janela = window as JanelaComVoz;
    setVozDisponivel(Boolean(janela.SpeechRecognition || janela.webkitSpeechRecognition));
    setSinteseDisponivel("AudioContext" in window || "webkitAudioContext" in window);
  }, []);

  useEffect(() => {
    rolagemRef.current?.scrollTo({ top: rolagemRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, carregando]);

  const pararVoz = useCallback(() => {
    vozAtivaRef.current = false;
    setVozAtiva(false);
    falaJobRef.current++;
    geminiSpeech.stop();
    falandoRef.current = false;
    reconhecedorRef.current?.abort();
    reconhecedorRef.current = null;
    setOuvindo(false);
    setFalando(false);
  }, [geminiSpeech.stop]);

  useEffect(() => {
    painelAbertoRef.current = estaAberto;
    if (!estaAberto) pararVoz();
  }, [estaAberto, pararVoz]);

  const iniciarEscuta = useCallback(() => {
    if (
      !vozAtivaRef.current ||
      trabalhandoRef.current ||
      falandoRef.current ||
      reconhecedorRef.current
    )
      return;
    const janela = window as JanelaComVoz;
    const Construtor = janela.SpeechRecognition || janela.webkitSpeechRecognition;
    if (!Construtor) {
      setAvisoVoz(
        "O reconhecimento de voz não está disponível neste navegador. Tente usar o Chrome.",
      );
      pararVoz();
      return;
    }
    const reconhecedor = new Construtor();
    reconhecedor.lang = "pt-BR";
    reconhecedor.continuous = false;
    reconhecedor.interimResults = false;
    reconhecedor.onresult = (event) => {
      const resultado = event.results[event.resultIndex];
      const transcricao = resultado?.[0]?.transcript?.trim();
      if (resultado?.isFinal && transcricao) void enviarMensagemRef.current(transcricao, true);
    };
    reconhecedor.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setAvisoVoz(
          "Permita o acesso ao microfone nas configurações do navegador para conversar por voz.",
        );
        pararVoz();
      } else if (event.error === "no-speech") {
        setAvisoVoz("Não ouvi sua fala. Tente novamente.");
      } else if (event.error !== "aborted") {
        setAvisoVoz("Não consegui ouvir agora. Confira o microfone e tente de novo.");
      }
    };
    reconhecedor.onend = () => {
      if (reconhecedorRef.current !== reconhecedor) return;
      setOuvindo(false);
      if (reconhecedorRef.current === reconhecedor) reconhecedorRef.current = null;
      if (vozAtivaRef.current && !trabalhandoRef.current && !falandoRef.current) {
        window.setTimeout(iniciarEscuta, 250);
      }
    };
    reconhecedorRef.current = reconhecedor;
    setAvisoVoz("");
    setOuvindo(true);
    try {
      reconhecedor.start();
    } catch {
      reconhecedorRef.current = null;
      setOuvindo(false);
    }
  }, [pararVoz]);

  const falarResposta = useCallback(
    async (resposta: string, avulsa = false) => {
      if (!vozAtivaRef.current && !avulsa) return;
      const current = ++falaJobRef.current;
      const reconhecedor = reconhecedorRef.current;
      reconhecedorRef.current = null;
      reconhecedor?.abort();
      setOuvindo(false);
      falandoRef.current = true;
      setFalando(true);
      setAvisoVoz("");
      try {
        await geminiSpeech.speak(resposta, vozGeminiRef.current);
      } catch (error) {
        if (current !== falaJobRef.current) return;
        vozAtivaRef.current = false;
        setVozAtiva(false);
        setAvisoVoz(
          error instanceof Error ? error.message : "Não consegui reproduzir a voz do Gemini agora.",
        );
      } finally {
        if (current === falaJobRef.current) {
          falandoRef.current = false;
          setFalando(false);
          if (vozAtivaRef.current) iniciarEscuta();
        }
      }
    },
    [geminiSpeech.speak, iniciarEscuta],
  );

  function atualizarVoz(patch: Partial<GeminiVoiceSettings>) {
    pararVoz();
    const settings = restoreGeminiVoice({ ...vozGeminiRef.current, ...patch });
    vozGeminiRef.current = settings;
    setVozGemini(settings);
    try {
      localStorage.setItem(
        `totem-gemini-voice:${perfilId ?? "visitante"}`,
        JSON.stringify(settings),
      );
    } catch {
      /* Storage is optional. */
    }
  }

  function brincar(acao: "wave" | "stethoscope" | "breathe") {
    if (trabalhandoRef.current) return;
    animar(acao);
    void enviarMensagem("", false, acao === "wave" ? "greeting" : acao);
  }

  async function abrirUrso() {
    void geminiSpeech.unlock().catch(() => {});
    painelAbertoRef.current = true;
    setAberto(true);
    setMostrarSaudacao(false);
    animar("wave");
    if (!saudacaoPromiseRef.current) {
      void enviarMensagem("", false, "greeting");
      return;
    }
    try {
      const resposta = await saudacaoPromiseRef.current;
      if (painelAbertoRef.current && lerRespostasRef.current && !trabalhandoRef.current)
        void falarResposta(resposta, true);
    } catch {
      setAvisoVoz("O Gemini não respondeu. Use Dar um oi para tentar novamente.");
    }
  }

  async function enviarMensagem(
    mensagem: string,
    veioDaVoz = false,
    acao?: "greeting" | "stethoscope" | "breathe",
  ) {
    const limpa = mensagem.trim();
    if ((!limpa && !acao) || trabalhandoRef.current) return;
    if (veioDaVoz || vozAtivaRef.current || lerRespostasRef.current || acao)
      void geminiSpeech.unlock().catch(() => {});
    trabalhandoRef.current = true;
    notifyMascot({ type: "thinking", active: true });
    reconhecedorRef.current?.stop();
    setTexto("");
    setAvisoVoz("");
    if (!acao)
      setMensagens((atuais) => [...atuais, { id: proximoId++, autor: "voce", texto: limpa }]);
    setCarregando(true);
    try {
      const resposta = jujuResponse(
        await conversarComJuju({
          data: {
            mensagem: limpa,
            ...(acao ? { acao, ...contextoDoUrso() } : {}),
            questaoId: questaoAtivaIdRef.current,
            historico: mensagens
              .filter((item) => !item.erro)
              .slice(-8)
              .map((item) => ({
                role: item.autor === "voce" ? ("user" as const) : ("assistant" as const),
                content: item.texto,
              })),
          },
        }),
      );
      setMensagens((atuais) => [...atuais, { id: proximoId++, autor: "jujubot", texto: resposta }]);
      if (
        painelAbertoRef.current &&
        (acao || veioDaVoz || vozAtivaRef.current || lerRespostasRef.current)
      )
        void falarResposta(resposta, true);
    } catch (erro) {
      const respostaErro =
        erro instanceof Error
          ? erro.message
          : "Não consegui responder agora. Tente de novo em instantes.";
      setMensagens((atuais) => [
        ...atuais,
        {
          id: proximoId++,
          autor: "jujubot",
          texto: respostaErro,
          erro: true,
          diagnostic: erro instanceof JujuConnectionError ? erro.diagnostic : undefined,
        },
      ]);
    } finally {
      trabalhandoRef.current = false;
      notifyMascot({ type: "thinking", active: false });
      setCarregando(false);
      if (vozAtivaRef.current && !falandoRef.current) iniciarEscuta();
    }
  }

  enviarMensagemRef.current = enviarMensagem;

  useEffect(() => {
    questaoAtivaIdRef.current = questaoAtiva?.id;
  }, [questaoAtiva?.id]);

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void enviarMensagem(texto);
  }

  function alternarVoz() {
    if (vozAtivaRef.current) {
      pararVoz();
      setAvisoVoz("Conversa por voz pausada.");
      return;
    }
    if (!vozDisponivel) {
      setAvisoVoz(
        "Seu navegador não oferece reconhecimento de voz. Use um navegador compatível, como o Chrome.",
      );
      return;
    }
    void geminiSpeech.unlock().catch(() => {});
    vozAtivaRef.current = true;
    setVozAtiva(true);
    setAvisoVoz("Conversa por voz ativada. Pode falar quando o microfone estiver ouvindo.");
    iniciarEscuta();
  }

  function fechar() {
    painelAbertoRef.current = false;
    pararVoz();
    setAberto(false);
    onFecharExterno();
  }

  useEffect(
    () => () => {
      vozAtivaRef.current = false;
      painelAbertoRef.current = false;
      falaJobRef.current++;
      reconhecedorRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (perguntaInicial && estaAberto && perguntaInicialEnviadaRef.current !== perguntaInicial) {
      perguntaInicialEnviadaRef.current = perguntaInicial;
      void enviarMensagem(perguntaInicial);
      onLimparPerguntaInicial();
    } else if (!perguntaInicial) {
      perguntaInicialEnviadaRef.current = null;
    }
    // Process each parent-supplied question once when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perguntaInicial, estaAberto]);

  return (
    <>
      {!estaAberto && (
        <DraggableMascot>
          {(mostrarRecado || mostrarSaudacao) && (
            <div
              className={`bear-greeting ${mostrarRecado ? "bear-dedication" : ""}`}
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                className="bear-dismiss"
                onClick={() => {
                  setRecadoFechado(true);
                  setMostrarSaudacao(false);
                }}
                aria-label="Fechar mensagem do urso"
              >
                ×
              </button>
              {mostrarRecado && (
                <strong className="bear-dedication-title">Um recado do seu irmão 💛</strong>
              )}
              <p className="bear-greeting-text">
                {mostrarRecado
                  ? "Seu irmão te ama muito, muito mais do que eu consigo demonstrar! Eu ja tenho muito orgulho de você mas eu sei que você pode muito mais, conte comigo sempre, Espero que goste do seu Totem"
                  : saudacao}
              </p>
              <button type="button" className="bear-greeting-action" onClick={abrirUrso}>
                Conversar com o Totem da sabedoria ↗
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={abrirUrso}
            aria-label="Conversar com o Totem da sabedoria"
            className="bear-launcher"
            data-bear-drag
            aria-describedby="bear-drag-help"
            onMouseEnter={() => animar("wave")}
            onFocus={() => animar("wave")}
          >
            <BearMascot gesto={gesto} falando={falando} />
            <span className="bear-name">Totem da sabedoria</span>
          </button>
        </DraggableMascot>
      )}

      {estaAberto && (
        <section
          className="jujubot-panel fixed bottom-4 right-4 z-50 flex h-[min(690px,calc(100dvh-2rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-[#52697b]/70 bg-[#111a24] shadow-2xl shadow-black/50"
          aria-label="Conversa com o Totem da sabedoria"
        >
          <header className="flex items-center gap-3 border-b border-white/10 bg-[#182431] px-4 py-3.5">
            <BearMascot pequeno gesto={ouvindo ? "stethoscope" : gesto} falando={falando} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold text-[#f1f4ef]">
                Totem da sabedoria
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#9eacb5]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${ouvindo ? "animate-pulse bg-emerald-400" : falando ? "animate-pulse bg-cyan-300" : "bg-[#83baa7]"}`}
                />
                {geminiSpeech.generating
                  ? "Gerando voz no Gemini…"
                  : ouvindo
                    ? "Estou ouvindo"
                    : falando
                      ? "Respondendo com a voz do Gemini"
                      : "Tutora UERJ 2027"}
              </div>
            </div>
            <button
              type="button"
              onClick={alternarVoz}
              aria-pressed={vozAtiva}
              aria-label={vozAtiva ? "Pausar conversa por voz" : "Ativar conversa por voz"}
              title="Conversa por voz"
              className={`rounded-xl border p-2.5 transition ${ouvindo || falando ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200" : "border-white/10 bg-white/5 text-[#c4d0d5] hover:bg-white/10"}`}
            >
              <MicIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar Totem da sabedoria"
              className="rounded-xl p-2 text-[#a9b5be] transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          <details className="shrink-0 border-b border-white/10 bg-[#151f29] px-4 py-2 text-xs text-[#d7e5e2]">
            <summary className="cursor-pointer py-1 font-semibold">
              Voz do Gemini · {vozGemini.voice}
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="col-span-2">
                Voz do Gemini
                <select
                  aria-label="Escolher voz do Gemini"
                  value={vozGemini.voice}
                  onChange={(event) =>
                    atualizarVoz({ voice: event.target.value as GeminiVoiceSettings["voice"] })
                  }
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0e151d] p-2 text-white"
                >
                  {GEMINI_VOICE_IDS.map((voice, index) => (
                    <option key={voice} value={voice}>
                      {voice} · {GEMINI_VOICE_LABELS[index]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2">
                Modelo de voz
                <select
                  aria-label="Modelo de voz do Gemini"
                  value={vozGemini.model}
                  onChange={(event) =>
                    atualizarVoz({ model: event.target.value as GeminiVoiceSettings["model"] })
                  }
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0e151d] p-2 text-white"
                >
                  <option value="fast">Gemini 3.8 Flash-Lite TTS · mais rápido</option>
                  <option value="quality">Gemini 3.8 Flash TTS · maior qualidade</option>
                </select>
              </label>
              <label>
                Tom
                <select
                  aria-label="Tom da voz"
                  value={vozGemini.style}
                  onChange={(event) =>
                    atualizarVoz({ style: event.target.value as GeminiVoiceSettings["style"] })
                  }
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0e151d] p-2 text-white"
                >
                  {Object.entries(GEMINI_STYLES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ritmo
                <select
                  aria-label="Ritmo da voz"
                  value={vozGemini.pace}
                  onChange={(event) =>
                    atualizarVoz({ pace: event.target.value as GeminiVoiceSettings["pace"] })
                  }
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0e151d] p-2 text-white"
                >
                  {Object.entries(GEMINI_PACES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!sinteseDisponivel || carregando || geminiSpeech.generating}
                className="rounded-lg border border-[#d4a574]/50 px-3 py-2 disabled:opacity-40"
                onClick={() => {
                  void geminiSpeech.unlock().catch(() => {});
                  void falarResposta(
                    "Oi, Ju! Sou o Totem da sabedoria. Conte comigo para estudar, aprender e seguir em frente.",
                    true,
                  );
                }}
              >
                Ouvir amostra
              </button>
              {(falando || geminiSpeech.generating) && (
                <button
                  type="button"
                  className="rounded-lg border border-white/30 px-3 py-2"
                  onClick={pararVoz}
                >
                  Parar áudio
                </button>
              )}
            </div>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={lerRespostas}
                onChange={(event) => {
                  const read = event.target.checked;
                  lerRespostasRef.current = read;
                  setLerRespostas(read);
                  if (!read) pararVoz();
                  try {
                    localStorage.setItem(
                      `totem-gemini-read:${perfilId ?? "visitante"}`,
                      String(read),
                    );
                  } catch {
                    /* Storage is optional. */
                  }
                }}
              />
              Ler respostas em voz alta
            </label>
            <p className="mt-2 text-[11px] text-[#9eacb5]">
              Voz gerada pelo Gemini em português brasileiro. Usa a cota de áudio do seu projeto
              Google; disponibilidade depende da chave.
            </p>
          </details>

          <div className="bear-playground">
            <BearMascot gesto={ouvindo ? "stethoscope" : gesto} falando={falando} />
            <div className="bear-play-actions">
              <p>
                {geminiSpeech.generating
                  ? "Preparando a voz do Gemini…"
                  : ouvindo
                    ? "Pode falar. Estou ouvindo!"
                    : falando
                      ? "Uma conversa de coração."
                      : gesto === "breathe"
                        ? "Inspire… e solte o ar, no seu ritmo."
                        : "Um abraço e um passo de cada vez."}
              </p>
              <div>
                <button type="button" disabled={carregando} onClick={() => brincar("wave")}>
                  👋 Dar um oi
                </button>
                <button type="button" disabled={carregando} onClick={() => brincar("stethoscope")}>
                  🩺 Brincar
                </button>
                <button type="button" disabled={carregando} onClick={() => brincar("breathe")}>
                  🌿 Respirar
                </button>
              </div>
            </div>
          </div>

          {(falando || geminiSpeech.generating) && (
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs text-[#b5d5cd]"
              role="status"
            >
              <span>
                {geminiSpeech.generating ? "Gerando voz no Gemini…" : "Reproduzindo voz do Gemini"}
              </span>
              <button
                type="button"
                onClick={pararVoz}
                className="rounded-lg border border-white/20 px-3 py-2"
              >
                Parar voz
              </button>
            </div>
          )}
          {questaoAtiva && (
            <div className="border-b border-white/5 bg-[#14202a] px-4 py-2.5 text-[11px] text-[#aec1c0]">
              Questão atual:{" "}
              <span className="font-semibold text-[#e6d19a]">{questaoAtiva.tema}</span>
            </div>
          )}

          <div
            ref={rolagemRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {mensagens.map((mensagem, index) => (
              <div
                key={mensagem.id}
                className={`flex ${mensagem.autor === "voce" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${mensagem.autor === "voce" ? "rounded-br-md bg-[#287a72] text-white" : "rounded-bl-md border border-white/5 bg-[#1b2935] text-[#e5eceb]"}`}
                >
                  {mensagem.autor === "jujubot" && (
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#91d8cb]">
                      Totem da sabedoria
                    </span>
                  )}
                  {mensagem.texto}
                  {mensagem.autor === "jujubot" && !mensagem.erro && !mensagem.pendente && (
                    <button
                      type="button"
                      disabled={carregando || !sinteseDisponivel}
                      onClick={() => {
                        void geminiSpeech.unlock().catch(() => {});
                        void falarResposta(mensagem.texto, true);
                      }}
                      className="mt-2 block rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#91d8cb] disabled:opacity-40"
                    >
                      Ouvir com o Gemini
                    </button>
                  )}
                  {mensagem.diagnostic && (
                    <details className="mt-2 text-[11px] text-[#a9b5be]">
                      <summary className="cursor-pointer">Detalhes da conexão</summary>
                      <p className="mt-1 whitespace-pre-wrap select-text">{mensagem.diagnostic}</p>
                    </details>
                  )}
                  {mensagem.erro &&
                    !mensagem.pendente &&
                    index === mensagens.length - 1 &&
                    !carregando && (
                      <button
                        type="button"
                        className="mt-2 block rounded-lg border border-[#d4a574]/50 px-3 py-2 text-xs text-[#edcca7]"
                        onClick={() => {
                          const previous = mensagens
                            .slice(0, index)
                            .reverse()
                            .find((item) => item.autor === "voce");
                          if (previous) void enviarMensagem(previous.texto);
                          else brincar("wave");
                        }}
                      >
                        Tentar novamente
                      </button>
                    )}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="text-xs text-[#a2b2b5]" role="status">
                O Totem da sabedoria está pensando…
              </div>
            )}
          </div>

          {avisoVoz && (
            <div className="border-t border-white/5 px-4 py-2 text-xs text-[#cfba83]" role="status">
              {avisoVoz}
            </div>
          )}

          <form
            onSubmit={enviarFormulario}
            className="flex items-end gap-2 border-t border-white/10 bg-[#151f29] p-3"
          >
            <label className="sr-only" htmlFor="jujubot-message">
              Escreva sua pergunta
            </label>
            <textarea
              id="jujubot-message"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void enviarMensagem(texto);
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder={ouvindo ? "Pode falar…" : "Pergunte sobre Biologia, Química ou Redação"}
              className="max-h-28 min-h-11 flex-1 resize-y rounded-2xl border border-white/10 bg-[#0e151d] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#778792] focus:border-[#64c9b8]/60"
            />
            <button
              type="button"
              onClick={alternarVoz}
              disabled={!vozDisponivel && !ouvindo}
              aria-label={vozAtiva ? "Pausar voz" : "Falar com o Totem da sabedoria"}
              title={
                vozDisponivel ? "Ativar conversa por voz" : "Voz não suportada neste navegador"
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-40 ${ouvindo || falando ? "bg-rose-500/20 text-rose-200" : "bg-white/5 text-[#a9c9c5] hover:bg-white/10"}`}
            >
              <MicIcon className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!texto.trim() || carregando}
              aria-label="Enviar mensagem"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4a574] text-[#171712] transition hover:bg-[#e1bb8e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function SendIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z" />
      <path d="M10 14 21 3" />
    </svg>
  );
}
