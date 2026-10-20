import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Questao2027 } from "../data/exame2027";
import { conversarComJuju } from "../lib/tutor-chat.functions";

interface Props {
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

function JujubotEye({ pequeno = false, falando = false }: { pequeno?: boolean; falando?: boolean }) {
  return (
    <span className={`jujubot-eye ${pequeno ? "jujubot-eye-small" : ""} ${falando ? "jujubot-eye-speaking" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 120 112" fill="none" className="h-full w-full">
        <defs>
          <radialGradient id="juju-shell" cx="50%" cy="34%" r="70%">
            <stop stopColor="#25374b" />
            <stop offset=".7" stopColor="#111b28" />
            <stop offset="1" stopColor="#090e16" />
          </radialGradient>
          <radialGradient id="juju-iris" cx="38%" cy="34%" r="65%">
            <stop stopColor="#fff5cf" />
            <stop offset=".18" stopColor="#f4d77d" />
            <stop offset=".48" stopColor="#79d8c6" />
            <stop offset="1" stopColor="#1a8090" />
          </radialGradient>
          <filter id="juju-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M18 49C24 28 41 16 60 16s36 12 42 33c-6 20-23 34-42 34S24 69 18 49Z" fill="url(#juju-shell)" stroke="#60738a" strokeWidth="2" />
        <path d="M29 49c8-10 18-15 31-15s23 5 31 15c-8 10-18 15-31 15S37 59 29 49Z" fill="#edf5e9" />
        <ellipse cx="61" cy="49" rx="14" ry="15" fill="url(#juju-iris)" filter="url(#juju-glow)" />
        <ellipse cx="61" cy="49" rx="5.5" ry="9" fill="#101820" />
        <circle cx="56" cy="43" r="3" fill="white" />
        <path d="M27 47c8-11 19-17 34-17s26 6 34 17" stroke="#8fe9db" strokeOpacity=".72" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 78c6 7 15 11 24 11s18-4 24-11" stroke="#d4a574" strokeWidth="3" strokeLinecap="round" />
        <path d="M37 83v5c0 10 9 17 23 17s23-7 23-17v-5" stroke="#d4a574" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M37 88v6c0 5 4 8 8 8" stroke="#d4a574" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="47" cy="102" r="4" fill="#101820" stroke="#d4a574" strokeWidth="2.5" />
        <path d="M83 88v9" stroke="#d4a574" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="83" cy="101" r="6" fill="#101820" stroke="#d4a574" strokeWidth="3" />
        <circle cx="83" cy="101" r="2" fill="#7de0cf" />
      </svg>
    </span>
  );
}

export default function TutorBot({
  questaoAtiva,
  abertoExternamente,
  onFecharExterno,
  perguntaInicial,
  onLimparPerguntaInicial,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    { id: 0, autor: "jujubot", texto: "Oi! Sou a JujuBot. Vamos estudar juntas? Pode escrever ou tocar no microfone para conversar por voz." },
  ]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [falando, setFalando] = useState(false);
  const [avisoVoz, setAvisoVoz] = useState("");
  const [vozDisponivel, setVozDisponivel] = useState(false);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const reconhecedorRef = useRef<ReconhecedorVoz | null>(null);
  const vozAtivaRef = useRef(false);
  const trabalhandoRef = useRef(false);
  const falandoRef = useRef(false);
  const questaoAtivaIdRef = useRef<string | undefined>(questaoAtiva?.id);
  const enviarMensagemRef = useRef<(mensagem: string, veioDaVoz?: boolean) => Promise<void>>(async () => {});
  const perguntaInicialEnviadaRef = useRef<string | null>(null);

  const estaAberto = aberto || abertoExternamente;

  useEffect(() => {
    const janela = window as JanelaComVoz;
    setVozDisponivel(Boolean(janela.SpeechRecognition || janela.webkitSpeechRecognition) && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    rolagemRef.current?.scrollTo({ top: rolagemRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, carregando]);

  const pararVoz = useCallback(() => {
    vozAtivaRef.current = false;
    falandoRef.current = false;
    reconhecedorRef.current?.abort();
    reconhecedorRef.current = null;
    window.speechSynthesis?.cancel();
    setOuvindo(false);
    setFalando(false);
  }, []);

  const iniciarEscuta = useCallback(() => {
    if (!vozAtivaRef.current || trabalhandoRef.current || falandoRef.current) return;
    const janela = window as JanelaComVoz;
    const Construtor = janela.SpeechRecognition || janela.webkitSpeechRecognition;
    if (!Construtor) {
      setAvisoVoz("O reconhecimento de voz não está disponível neste navegador. Tente usar o Chrome.");
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
        setAvisoVoz("Permita o acesso ao microfone nas configurações do navegador para conversar por voz.");
        pararVoz();
      } else if (event.error === "no-speech") {
        setAvisoVoz("Não ouvi sua fala. Tente novamente.");
      } else if (event.error !== "aborted") {
        setAvisoVoz("Não consegui ouvir agora. Confira o microfone e tente de novo.");
      }
    };
    reconhecedor.onend = () => {
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
      setOuvindo(false);
    }
  }, [pararVoz]);

  const falarResposta = useCallback((resposta: string) => {
    if (!vozAtivaRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(resposta);
    fala.lang = "pt-BR";
    fala.rate = 1;
    const vozPortugues = window.speechSynthesis.getVoices().find((voz) => voz.lang.toLowerCase().startsWith("pt-br"));
    if (vozPortugues) fala.voice = vozPortugues;
    falandoRef.current = true;
    setFalando(true);
    fala.onend = () => {
      falandoRef.current = false;
      setFalando(false);
      if (vozAtivaRef.current) iniciarEscuta();
    };
    fala.onerror = () => {
      falandoRef.current = false;
      setFalando(false);
      if (vozAtivaRef.current) iniciarEscuta();
    };
    window.speechSynthesis.speak(fala);
  }, [iniciarEscuta]);

  async function enviarMensagem(mensagem: string, veioDaVoz = false) {
    const limpa = mensagem.trim();
    if (!limpa || trabalhandoRef.current) return;
    trabalhandoRef.current = true;
    reconhecedorRef.current?.stop();
    setTexto("");
    setAvisoVoz("");
    setMensagens((atuais) => [...atuais, { id: proximoId++, autor: "voce", texto: limpa }]);
    setCarregando(true);
    try {
      const resposta = await conversarComJuju({
        data: {
          mensagem: limpa,
          questaoId: questaoAtivaIdRef.current,
          historico: mensagens.slice(-8).map((item) => ({
            role: item.autor === "voce" ? "user" as const : "assistant" as const,
            content: item.texto,
          })),
        },
      });
      setMensagens((atuais) => [...atuais, { id: proximoId++, autor: "jujubot", texto: resposta }]);
      if (veioDaVoz || vozAtivaRef.current) falarResposta(resposta);
    } catch (erro) {
      const respostaErro = erro instanceof Error ? erro.message : "Não consegui responder agora. Tente de novo em instantes.";
      setMensagens((atuais) => [...atuais, { id: proximoId++, autor: "jujubot", texto: respostaErro }]);
      if (veioDaVoz || vozAtivaRef.current) falarResposta(respostaErro);
    } finally {
      trabalhandoRef.current = false;
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
      setAvisoVoz("Seu navegador não oferece reconhecimento de voz. Use um navegador compatível, como o Chrome.");
      return;
    }
    vozAtivaRef.current = true;
    setAvisoVoz("Conversa por voz ativada. Pode falar quando o microfone estiver ouvindo.");
    iniciarEscuta();
  }

  function fechar() {
    pararVoz();
    setAberto(false);
    onFecharExterno();
  }

  useEffect(() => () => {
    vozAtivaRef.current = false;
    reconhecedorRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

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
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir JujuBot"
          className="jujubot-launcher fixed bottom-5 right-5 z-[60] flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[#8fe9db]/60 bg-[#101820] shadow-xl shadow-[#48b8a6]/20 transition hover:scale-105"
        >
          <JujubotEye pequeno />
          <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-ink-950 bg-[#d4a574] p-1.5 text-ink-950">
            <StethoIcon className="h-4 w-4" />
          </span>
        </button>
      )}

      {estaAberto && (
        <section className="jujubot-panel fixed bottom-4 right-4 z-[60] flex h-[min(690px,calc(100dvh-2rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-[#52697b]/70 bg-[#111a24] shadow-2xl shadow-black/50" aria-label="Conversa com a JujuBot">
          <header className="flex items-center gap-3 border-b border-white/10 bg-[#182431] px-4 py-3.5">
            <JujubotEye pequeno falando={falando} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold text-[#f1f4ef]">JujuBot</div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#9eacb5]">
                <span className={`h-1.5 w-1.5 rounded-full ${ouvindo ? "animate-pulse bg-emerald-400" : falando ? "animate-pulse bg-cyan-300" : "bg-[#83baa7]"}`} />
                {ouvindo ? "Estou ouvindo" : falando ? "Respondendo por voz" : "Tutora UERJ 2027"}
              </div>
            </div>
            <button type="button" onClick={alternarVoz} aria-pressed={ouvindo || falando} aria-label={ouvindo || falando ? "Pausar conversa por voz" : "Ativar conversa por voz"} title="Conversa por voz" className={`rounded-xl border p-2.5 transition ${ouvindo || falando ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200" : "border-white/10 bg-white/5 text-[#c4d0d5] hover:bg-white/10"}`}>
              <MicIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={fechar} aria-label="Fechar JujuBot" className="rounded-xl p-2 text-[#a9b5be] transition hover:bg-white/10 hover:text-white">
              <CloseIcon className="h-5 w-5" />
            </button>
          </header>

          {questaoAtiva && (
            <div className="border-b border-white/5 bg-[#14202a] px-4 py-2.5 text-[11px] text-[#aec1c0]">
              Questão atual: <span className="font-semibold text-[#e6d19a]">{questaoAtiva.tema}</span>
            </div>
          )}

          <div ref={rolagemRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {mensagens.map((mensagem) => (
              <div key={mensagem.id} className={`flex ${mensagem.autor === "voce" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${mensagem.autor === "voce" ? "rounded-br-md bg-[#287a72] text-white" : "rounded-bl-md border border-white/5 bg-[#1b2935] text-[#e5eceb]"}`}>
                  {mensagem.autor === "jujubot" && <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#91d8cb]">JujuBot</span>}
                  {mensagem.texto}
                </div>
              </div>
            ))}
            {carregando && <div className="text-xs text-[#a2b2b5]" role="status">JujuBot está pensando…</div>}
          </div>

          {avisoVoz && <div className="border-t border-white/5 px-4 py-2 text-xs text-[#cfba83]" role="status">{avisoVoz}</div>}

          <form onSubmit={enviarFormulario} className="flex items-end gap-2 border-t border-white/10 bg-[#151f29] p-3">
            <label className="sr-only" htmlFor="jujubot-message">Escreva sua pergunta</label>
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
            <button type="button" onClick={alternarVoz} disabled={!vozDisponivel && !ouvindo} aria-label={ouvindo || falando ? "Pausar voz" : "Falar com a JujuBot"} title={vozDisponivel ? "Ativar conversa por voz" : "Voz não suportada neste navegador"} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-40 ${ouvindo || falando ? "bg-rose-500/20 text-rose-200" : "bg-white/5 text-[#a9c9c5] hover:bg-white/10"}`}>
              <MicIcon className="h-5 w-5" />
            </button>
            <button type="submit" disabled={!texto.trim() || carregando} aria-label="Enviar mensagem" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4a574] text-[#171712] transition hover:bg-[#e1bb8e] disabled:cursor-not-allowed disabled:opacity-40">
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function StethoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v2.5a4.5 4.5 0 0 0 9 0v-2"/><circle cx="19" cy="11.5" r="2.2"/></svg>;
}

function MicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"/></svg>;
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

function SendIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z"/><path d="M10 14 21 3"/></svg>;
}
