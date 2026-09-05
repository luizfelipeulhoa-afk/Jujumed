import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import QuestionCard from "./components/QuestionCard";
import Thermometer from "./components/Thermometer";
import {
  IconCross,
  IconHeartPulse,
  IconPulse,
  IconReset,
  IconStetho,
  IconTerminal,
  IconTimer,
  IconDownload,
  IconCheck,
} from "./components/icons";
import { AREAS, QUESTIONS, type AreaId } from "./data/questions";
import {
  META_ACERTOS,
  ERROS_TOLERADOS,
  TOTAL_ITENS_PROVA,
  calculaEstatisticas,
  corrigeResposta,
  formatTempo,
  proximaQuestao,
  type Letra,
  type RespostaRegistrada,
  type ResultadoCheck,
} from "./lib/tutor";

const STORAGE_KEY = "tutor-uerj-medicina-v1";

interface Sessao {
  fila: string[];
  respostas: Record<string, RespostaRegistrada>;
  elapsed: number;
}

function carregarSessao(): Sessao {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Sessao;
      if (Array.isArray(s.fila) && s.fila.length > 0) return s;
    }
  } catch {
    /* sessão corrompida → recomeça */
  }
  return { fila: QUESTIONS.map((q) => q.id), respostas: {}, elapsed: 0 };
}

function EcgStrip() {
  return (
    <svg
      className="absolute inset-x-0 top-0 h-10 w-full text-uerj-red/40 pointer-events-none"
      viewBox="0 0 620 40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        className="ecg-line"
        d="M0 22 H70 L80 22 L88 8 L96 32 L104 22 H150 L158 22 L164 14 L170 28 L176 22 H240 L250 22 L258 4 L266 34 L274 22 H330 L338 22 L344 15 L350 29 L356 22 H420 L430 22 L438 6 L446 33 L454 22 H520 L528 22 L534 14 L540 28 L546 22 H620"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FundoAmbiente() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-ink-950" />
      <div
        className="fixed inset-0 -z-10 animate-glow"
        style={{
          background:
            "radial-gradient(700px 380px at 12% -6%, rgba(224,58,72,0.13), transparent 60%), radial-gradient(760px 420px at 88% 8%, rgba(91,141,239,0.10), transparent 60%), radial-gradient(700px 500px at 50% 115%, rgba(47,191,143,0.07), transparent 60%)",
        }}
      />
      <div className="fixed inset-0 -z-10 grid-texture" />
    </>
  );
}

function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-full max-w-lg rounded-xl border border-ink-600 bg-ink-850 shadow-2xl shadow-black/60 animate-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
          <h3 className="font-display font-bold text-ink-100">{titulo}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-300 hover:text-ink-100 hover:bg-ink-700 transition-colors"
            aria-label="Fechar"
          >
            <IconCross className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [sessao, setSessao] = useState<Sessao>(carregarSessao);
  const [corrigindo, setCorrigindo] = useState(false);
  const [resultadoAtual, setResultadoAtual] = useState<ResultadoCheck | null>(null);
  const [letraAtual, setLetraAtual] = useState<Letra | null>(null);
  const [modalReset, setModalReset] = useState(false);
  const [modalApi, setModalApi] = useState(false);
  const topoRef = useRef<HTMLDivElement>(null);

  const respostas = useMemo(() => new Map(Object.entries(sessao.respostas)), [sessao.respostas]);
  const stats = useMemo(() => calculaEstatisticas(respostas), [respostas]);

  // Índice da questão ativa: deliberadamente DESCONECTADO do conjunto de respostas.
  // Registrar uma resposta NÃO troca a questão exibida — o enunciado e as
  // alternativas continuam na tela enquanto o feedback estiver aberto.
  const [ativaId, setAtivaId] = useState<string | null>(() => {
    const s = carregarSessao();
    return s.fila.find((id) => !s.respostas[id]) ?? null;
  });

  const questaoAtual = useMemo(
    () => (ativaId ? QUESTIONS.find((q) => q.id === ativaId) ?? null : null),
    [ativaId],
  );
  // Próxima questão pendente da fila — usada APENAS para decidir o avanço.
  const proximaPendente = useMemo(() => proximaQuestao(sessao.fila, respostas), [sessao.fila, respostas]);
  const concluido = questaoAtual === null;
  const erros = QUESTIONS.filter((q) => {
    const r = respostas.get(q.id);
    return r && !r.is_correct;
  });

  /* cronômetro */
  useEffect(() => {
    if (concluido) return;
    const t = setInterval(() => setSessao((s) => ({ ...s, elapsed: s.elapsed + 1 })), 1000);
    return () => clearInterval(t);
  }, [concluido]);

  /* persistência */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
  }, [sessao]);

  /* registra a resposta (espelha POST /api/check-answer) */
  const responder = useCallback(
    (letra: Letra) => {
      if (!questaoAtual || corrigindo || respostas.has(questaoAtual.id)) return;
      setCorrigindo(true);
      window.setTimeout(() => {
        const resultado = corrigeResposta(questaoAtual.id, letra, respostas);
        if (resultado) {
          setSessao((s) => ({
            ...s,
            respostas: {
              ...s.respostas,
              [questaoAtual.id]: {
                question_id: questaoAtual.id,
                selected_option: letra,
                is_correct: resultado.is_correct,
                mensagem_tutor: resultado.mensagem_tutor,
                explicacao_didatica: resultado.explicacao_didatica,
                por_que_escolhida_errada: resultado.por_que_escolhida_errada,
                dica_de_ouro_uerj: resultado.dica_de_ouro_uerj,
              },
            },
          }));
          setResultadoAtual(resultado);
          setLetraAtual(letra);
        }
        setCorrigindo(false);
      }, 480);
    },
    [questaoAtual, corrigindo, respostas],
  );

  // "Próxima questão" — ÚNICO lugar em que o índice ativo avança.
  // Se não houver mais pendentes, ativaId vira null e a tela de resultados assume.
  const avancar = useCallback(() => {
    setAtivaId(proximaPendente ? proximaPendente.id : null);
    setResultadoAtual(null);
    setLetraAtual(null);
    topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [proximaPendente]);

  const resetar = useCallback(() => {
    const filaInicial = QUESTIONS.map((q) => q.id);
    setSessao({ fila: filaInicial, respostas: {}, elapsed: 0 });
    setAtivaId(filaInicial[0]);
    setResultadoAtual(null);
    setLetraAtual(null);
    setModalReset(false);
    topoRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const revisarErros = useCallback(() => {
    const filaErros = erros.map((q) => q.id);
    setSessao({ fila: filaErros, respostas: {}, elapsed: 0 });
    setAtivaId(filaErros[0] ?? null);
    setResultadoAtual(null);
    setLetraAtual(null);
    topoRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [erros]);

  const dots = sessao.fila.map((id) => {
    const r = respostas.get(id);
    return { id, ok: r ? r.is_correct : null };
  });
  const ordem = questaoAtual ? sessao.fila.indexOf(questaoAtual.id) + 1 : 0;
  const restante = sessao.fila.length - stats.total_respondidas;

  const saudacao = stats.total_respondidas === 0;

  return (
    <div className="min-h-screen">
      <FundoAmbiente />

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur-md">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <EcgStrip />
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(224,58,72,0.14)] border border-uerj-red/50">
                <IconHeartPulse className="w-6 h-6 text-uerj-red" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emer animate-pulse-dot border-2 border-ink-900" />
              </span>
              <div className="min-w-0">
                <h1 className="font-display font-extrabold text-[15px] sm:text-base leading-tight text-ink-100 truncate">
                  Rumo ao Conceito <span className="text-emer">A</span>
                </h1>
                <p className="text-[11px] text-ink-400 truncate">
                  Tutora pessoal · Medicina UERJ · 2º Exame de Qualificação
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 font-mono text-sm font-bold text-ink-100 tabular-nums"
                title="Cronômetro da sessão de estudos"
              >
                <IconTimer className={`w-4 h-4 ${concluido ? "text-ink-400" : "text-uerj-gold"}`} />
                {formatTempo(sessao.elapsed)}
              </span>
              <button
                onClick={() => setModalApi(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-ink-100 hover:border-uerj-blue/60 transition-colors"
                title="Versão backend FastAPI (app.py)"
              >
                <IconTerminal className="w-4 h-4 text-uerj-blue" />
                app.py
              </button>
              <button
                onClick={() => setModalReset(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-uerj-red hover:border-uerj-red/60 transition-colors"
                title="Reiniciar simulado (GET /api/reset)"
              >
                <IconReset className="w-4 h-4" />
                <span className="hidden md:inline">Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        <Thermometer stats={stats} respostas={respostas} />

        <div ref={topoRef} className="min-w-0 scroll-mt-24">
          {/* faixa de contexto */}
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-300">
            <span className="inline-flex items-center gap-1.5">
              <IconStetho className="w-4 h-4 text-uerj-red" />
              Sessão personalizada: <strong className="text-ink-100">Medicina — 2º EQ</strong>
            </span>
            <span className="hidden sm:inline text-ink-600">•</span>
            <span>
              Faltam <strong className="font-mono text-uerj-gold">{restante}</strong>{" "}
              {restante === 1 ? "questão" : "questões"} nesta rodada
            </span>
          </div>

          {!concluido && questaoAtual && (
            <>
              {saudacao && (
                <div className="mb-5 rounded-xl border border-emer/30 bg-[rgba(47,191,143,0.06)] px-4 py-3.5 animate-fade-up">
                  <p className="text-[13.5px] leading-relaxed text-ink-200">
                    <strong className="text-emer font-display">Oi, futura médica! 👋</strong> Eu sou sua tutora de
                    plantão. Vamos treinar no padrão exato da UERJ: você responde, eu corrijo na hora, explico o
                    porquê de cada alternativa e te entrego a dica de ouro da banca. Meta da casa:{" "}
                    <strong className="text-ink-100">{META_ACERTOS} acertos em 60 itens</strong> — o Conceito A que
                    vale <strong className="text-emer">+20 pontos</strong> na 2ª fase. Pode começar.
                  </p>
                </div>
              )}
              <QuestionCard
                question={questaoAtual}
                ordem={ordem}
                total={sessao.fila.length}
                resultado={resultadoAtual}
                letraEscolhida={letraAtual}
                onAnswer={responder}
                onNext={avancar}
                dots={dots}
                corrigindo={corrigindo}
                ehUltima={restante <= 1}
              />
            </>
          )}

          {/* tela de conclusão */}
          {concluido && (
            <section className="animate-fade-up rounded-xl border border-ink-700 bg-ink-850 overflow-hidden">
              <div
                className="px-6 py-5 border-b border-ink-700"
                style={{
                  background:
                    stats.projecao_conceito === "A"
                      ? "linear-gradient(90deg, rgba(47,191,143,0.14), transparent 70%)"
                      : "linear-gradient(90deg, rgba(91,141,239,0.12), transparent 70%)",
                }}
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-uerj-gold mb-1">
                  <IconPulse className="w-4 h-4" /> Simulado concluído
                </div>
                <h2 className="font-display font-extrabold text-2xl text-ink-100">
                  Resultado da rodada ·{" "}
                  <span
                    style={{
                      color:
                        stats.projecao_conceito === "A"
                          ? "#2fbf8f"
                          : stats.projecao_conceito === "B"
                            ? "#5b8def"
                            : stats.projecao_conceito === "C"
                              ? "#e8b54d"
                              : "#e03a48",
                    }}
                  >
                    Conceito {stats.projecao_conceito}
                  </span>
                </h2>
                <p className="mt-1 text-[13.5px] text-ink-300 italic">
                  {stats.projecao_conceito === "A"
                    ? "“É esse aproveitamento que separa quem SONHA com Medicina de quem ASSINA a lista de aprovados. Orgulho define.”"
                    : stats.projecao_conceito === "B"
                      ? "“Você está a um ajuste fino do Conceito A. Os erros de hoje são o mapa exato do que revisar.”"
                      : "“Todo conceito A começou exatamente aqui: errando no treino e entendendo o porquê. Bora transformar isso em aprovação?”"}
                </p>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { l: "Acertos", v: `${stats.acertos}`, c: "#2fbf8f" },
                    { l: "Aproveitamento", v: `${stats.taxa_aproveitamento.toFixed(1)}%`, c: "#5b8def" },
                    { l: "Tempo total", v: formatTempo(sessao.elapsed), c: "#e8b54d" },
                    { l: "Margem usada", v: `${stats.erros}/${ERROS_TOLERADOS}`, c: "#e03a48" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-ink-800 border border-ink-700 py-3">
                      <div className="font-mono font-bold text-lg leading-none" style={{ color: s.c }}>
                        {s.v}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-1.5">{s.l}</div>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  {erros.length > 0 ? (
                    erros.map((q) => {
                      const r = respostas.get(q.id)!;
                      return (
                        <div key={q.id} className="rounded-lg border border-uerj-red-soft/40 bg-[rgba(185,48,65,0.07)] px-3.5 py-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: AREAS[q.area as AreaId].cor }}>
                              {AREAS[q.area].nome}
                            </span>
                            <span className="font-mono text-[11px] text-ink-400">
                              você: {r.selected_option} · gabarito: {q.gabarito}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-ink-200 leading-snug">{q.tema}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="sm:col-span-2 rounded-lg border border-emer/40 bg-[rgba(47,191,143,0.08)] px-4 py-3 flex items-center gap-2.5">
                      <IconCheck className="w-5 h-5 text-emer shrink-0" />
                      <p className="text-[13px] text-ink-100">
                        <strong>Gabaritou a rodada!</strong> Nenhum erro para revisar — partiu aprofundar com mais questões.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {erros.length > 0 && (
                    <button
                      onClick={revisarErros}
                      className="inline-flex items-center gap-2 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-5 py-2.5 transition-all hover:shadow-[0_6px_24px_rgba(47,191,143,0.35)] active:scale-[0.98]"
                    >
                      <IconReset className="w-4 h-4" />
                      Treinar de novo os {erros.length} {erros.length === 1 ? "erro" : "erros"}
                    </button>
                  )}
                  <button
                    onClick={resetar}
                    className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 hover:border-uerj-red/60 text-ink-200 hover:text-uerj-red font-display font-bold text-sm px-5 py-2.5 transition-colors"
                  >
                    <IconReset className="w-4 h-4" />
                    Reiniciar simulado completo
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-ink-800 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-ink-400">
          <span>
            Treino focado no 2º EQ da UERJ · {QUESTIONS.length} questões contextualizadas · Meta: {META_ACERTOS}/{TOTAL_ITENS_PROVA} para o Conceito A (+20 pts)
          </span>
          <button onClick={() => setModalApi(true)} className="inline-flex items-center gap-1.5 hover:text-uerj-blue transition-colors font-medium">
            <IconTerminal className="w-3.5 h-3.5" />
            Backend FastAPI (app.py)
          </button>
        </div>
      </footer>

      {/* modal reset */}
      {modalReset && (
        <Modal titulo="Reiniciar sessão de estudos" onClose={() => setModalReset(false)}>
          <p className="text-[13.5px] leading-relaxed text-ink-200 mb-4">
            Isso apaga <strong className="text-ink-100">todo o histórico</strong> desta sessão (acertos, erros,
            cronômetro e margem) — como chamar <code className="font-mono text-uerj-blue">GET /api/reset</code>. Quer
            mesmo recomeçar do zero?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setModalReset(false)}
              className="rounded-lg border border-ink-600 px-4 py-2 text-[13px] font-semibold text-ink-200 hover:bg-ink-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={resetar}
              className="rounded-lg bg-uerj-red hover:bg-uerj-red-soft text-white font-display font-bold text-[13px] px-4 py-2 transition-colors"
            >
              Sim, reiniciar
            </button>
          </div>
        </Modal>
      )}

      {/* modal fastapi */}
      {modalApi && (
        <Modal titulo="Versão backend · app.py (FastAPI)" onClose={() => setModalApi(false)}>
          <p className="text-[13px] leading-relaxed text-ink-200 mb-3">
            Este tutor também roda como aplicação Python autossuficiente, com os endpoints{" "}
            <code className="font-mono text-uerj-blue text-[12px]">/api/next-question</code>,{" "}
            <code className="font-mono text-uerj-blue text-[12px]">/api/check-answer</code> e{" "}
            <code className="font-mono text-uerj-blue text-[12px]">/api/reset</code> e a mesma interface servida em{" "}
            <code className="font-mono text-uerj-blue text-[12px]">/</code>.
          </p>
          <div className="rounded-lg bg-ink-950 border border-ink-700 p-4 font-mono text-[12.5px] leading-relaxed mb-4">
            <div className="text-ink-400"># 1) instale as dependências</div>
            <div className="text-emer">pip install fastapi uvicorn</div>
            <div className="text-ink-400 mt-2"># 2) rode o tutor (porta 8000)</div>
            <div className="text-emer">python app.py</div>
            <div className="text-ink-400 mt-2"># 3) abra http://localhost:8000</div>
          </div>
          <a
            href="/app.py"
            download="app.py"
            className="inline-flex items-center gap-2 rounded-lg bg-uerj-blue hover:brightness-110 text-ink-950 font-display font-bold text-[13px] px-4 py-2.5 transition-all active:scale-[0.98]"
          >
            <IconDownload className="w-4 h-4" />
            Baixar app.py completo
          </a>
        </Modal>
      )}
    </div>
  );
}
