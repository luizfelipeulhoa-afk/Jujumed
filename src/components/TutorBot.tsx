import { notifyMascot } from "../lib/mascot-events";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import BearMascot from "./BearMascot";
import DraggableMascot from "./DraggableMascot";
import "./bear-mascot.css";
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
  diagnostic?: string;
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
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);
  const [vozEscolhida, setVozEscolhida] = useState("");
  const vozEscolhidaRef = useRef("");
  const rolagemRef = useRef<HTMLDivElement>(null);
  const reconhecedorRef = useRef<ReconhecedorVoz | null>(null);
  const vozAtivaRef = useRef(false);
  const trabalhandoRef = useRef(false);
  const falandoRef = useRef(false);
  const falaRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [vozAtiva, setVozAtiva] = useState(false);
  const questaoAtivaIdRef = useRef<string | undefined>(questaoAtiva?.id);
  const enviarMensagemRef = useRef<(mensagem: string, veioDaVoz?: boolean) => Promise<void>>(
    async () => {},
  );
  const perguntaInicialEnviadaRef = useRef<string | null>(null);

  const estaAberto = aberto || abertoExternamente;

  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(`totem-voice:${perfilId ?? "visitante"}`) ?? "";
    } catch {
      /* Storage is optional. */
    }
    vozEscolhidaRef.current = saved;
    setVozEscolhida(saved);
  }, [perfilId]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSinteseDisponivel(true);
    const update = () =>
      setVozes(
        [...window.speechSynthesis.getVoices()].sort((a, b) => {
          const rank = (voice: SpeechSynthesisVoice) =>
            /^pt[-_]br$/i.test(voice.lang) ? 0 : /^pt/i.test(voice.lang) ? 1 : 2;
          return rank(a) - rank(b) || a.name.localeCompare(b.name);
        }),
      );
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  useEffect(() => {
    const janela = window as JanelaComVoz;
    setVozDisponivel(
      Boolean(janela.SpeechRecognition || janela.webkitSpeechRecognition) &&
        "speechSynthesis" in window,
    );
  }, []);

  useEffect(() => {
    rolagemRef.current?.scrollTo({ top: rolagemRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, carregando]);

  const pararVoz = useCallback(() => {
    vozAtivaRef.current = false;
    setVozAtiva(false);
    falaRef.current = null;
    falandoRef.current = false;
    reconhecedorRef.current?.abort();
    reconhecedorRef.current = null;
    window.speechSynthesis?.cancel();
    setOuvindo(false);
    setFalando(false);
  }, []);

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
    (resposta: string, avulsa = false) => {
      if ((!vozAtivaRef.current && !avulsa) || !("speechSynthesis" in window)) return;
      const reconhecedor = reconhecedorRef.current;
      reconhecedorRef.current = null;
      reconhecedor?.abort();
      setOuvindo(false);
      falaRef.current = null;
      window.speechSynthesis.cancel();
      const fala = new SpeechSynthesisUtterance(resposta);
      falaRef.current = fala;
      fala.lang = "pt-BR";
      fala.rate = 1;
      const available = window.speechSynthesis.getVoices();
      const selected =
        available.find((voz) => voz.voiceURI === vozEscolhidaRef.current) ??
        available.find((voz) => /^pt[-_]br$/i.test(voz.lang)) ??
        available.find((voz) => /^pt/i.test(voz.lang));
      if (selected) {
        fala.voice = selected;
        fala.lang = selected.lang;
      }
      falandoRef.current = true;
      setFalando(true);
      fala.onend = () => {
        if (falaRef.current !== fala) return;
        falaRef.current = null;
        falandoRef.current = false;
        setFalando(false);
        if (vozAtivaRef.current) iniciarEscuta();
      };
      fala.onerror = () => {
        if (falaRef.current !== fala) return;
        falaRef.current = null;
        falandoRef.current = false;
        setFalando(false);
        if (vozAtivaRef.current) iniciarEscuta();
      };
      window.speechSynthesis.speak(fala);
    },
    [iniciarEscuta],
  );

  function brincar(acao: "wave" | "stethoscope" | "breathe") {
    if (trabalhandoRef.current) return;
    animar(acao);
    void enviarMensagem("", false, acao === "wave" ? "greeting" : acao);
  }

  async function abrirUrso() {
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
      if (painelAbertoRef.current && !trabalhandoRef.current) falarResposta(resposta, true);
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
      if (acao && painelAbertoRef.current) falarResposta(resposta, true);
      else if (veioDaVoz || vozAtivaRef.current) falarResposta(resposta);
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
      if (veioDaVoz || vozAtivaRef.current) falarResposta(respostaErro);
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
      falaRef.current = null;
      reconhecedorRef.current?.abort();
      window.speechSynthesis?.cancel();
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
                {ouvindo ? "Estou ouvindo" : falando ? "Respondendo por voz" : "Tutora UERJ 2027"}
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
            <summary className="cursor-pointer py-1 font-semibold">Voz do Totem</summary>
            <label htmlFor="totem-voice" className="mt-2 block">
              Escolha a voz de leitura
            </label>
            <div className="mt-1 flex items-center gap-2">
              <select
                id="totem-voice"
                value={vozEscolhida}
                disabled={!sinteseDisponivel}
                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-[#0e151d] p-2 text-white focus:outline-2 focus:outline-[#d4a574]"
                onChange={(event) => {
                  const value = event.target.value;
                  vozEscolhidaRef.current = value;
                  setVozEscolhida(value);
                  try {
                    localStorage.setItem(`totem-voice:${perfilId ?? "visitante"}`, value);
                  } catch {
                    /* Storage is optional. */
                  }
                }}
              >
                <option value="">Automática · Português</option>
                {vozEscolhida && !vozes.some((voz) => voz.voiceURI === vozEscolhida) && (
                  <option value={vozEscolhida}>Voz salva indisponível · usando automática</option>
                )}
                {vozes.map((voz) => (
                  <option key={voz.voiceURI} value={voz.voiceURI}>
                    {voz.name} · {voz.lang}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!sinteseDisponivel || carregando}
                className="shrink-0 rounded-lg border border-[#d4a574]/50 px-2 py-2 disabled:opacity-40"
                onClick={() =>
                  falarResposta(
                    "Oi, Ju! Sou o Totem da sabedoria. Esta é a voz que você escolheu.",
                    true,
                  )
                }
              >
                Ouvir amostra
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#9eacb5]">
              {sinteseDisponivel
                ? "O Gemini escreve as respostas; a voz é do navegador. As opções variam por dispositivo."
                : "Este navegador não oferece leitura em voz alta."}
            </p>
          </details>

          <div className="bear-playground">
            <BearMascot gesto={ouvindo ? "stethoscope" : gesto} falando={falando} />
            <div className="bear-play-actions">
              <p>
                {ouvindo
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
