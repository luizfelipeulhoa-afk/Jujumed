import type { CSSProperties } from "react";
import { AREAS, type Question, type AreaId } from "../data/questions";
import type { Letra, ResultadoCheck } from "../lib/tutor";
import { IconArrow, IconCheck, IconCross, IconHeartPulse, IconStar } from "./icons";

const LETRAS: Letra[] = ["A", "B", "C", "D"];

interface Props {
  question: Question;
  ordem: number; // 1-indexed na fila
  total: number;
  resultado: ResultadoCheck | null; // null = ainda não respondida
  letraEscolhida: Letra | null;
  onAnswer: (letra: Letra) => void;
  onNext: () => void;
  dots: { id: string; ok: boolean | null }[];
  corrigindo: boolean;
  ehUltima: boolean;
}

function corArea(area: AreaId) {
  return AREAS[area];
}

export default function QuestionCard({
  question,
  ordem,
  total,
  resultado,
  letraEscolhida,
  onAnswer,
  onNext,
  dots,
  corrigindo,
  ehUltima,
}: Props) {
  const area = corArea(question.area);
  const respondida = resultado !== null;

  return (
    <article key={question.id} className="animate-fade-up">
      {/* trilha de progresso */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="font-mono text-[11px] text-ink-400 uppercase tracking-widest">
          Questão {ordem} / {total}
        </span>
        <div className="flex gap-1.5 items-center flex-wrap">
          {dots.map((d) => (
            <span
              key={d.id}
              className="w-2 h-2 rounded-full transition-colors duration-300"
              style={{
                background:
                  d.ok === null ? "#2e4055" : d.ok ? "#2fbf8f" : "#e03a48",
                boxShadow:
                  d.ok === null
                    ? undefined
                    : d.ok
                      ? "0 0 5px rgba(47,191,143,0.6)"
                      : "0 0 5px rgba(224,58,72,0.5)",
              }}
            />
          ))}
        </div>
      </div>

      <section className="rounded-xl border border-ink-700 bg-ink-850 overflow-hidden">
        {/* cabeçalho da questão */}
        <div
          className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-ink-700"
          style={{ background: `linear-gradient(90deg, ${area.corSoft}, transparent 65%)` }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: area.cor, background: area.corSoft, border: `1px solid ${area.cor}44` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: area.cor }} />
            {area.nome}
          </span>
          <span className="font-mono text-[11px] text-ink-400 hidden sm:block">{question.tema}</span>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {/* texto de apoio */}
          {question.apoio && (
            <blockquote
              className="mb-4 rounded-r-lg border-l-[3px] bg-ink-800/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink-200 italic"
              style={{ borderColor: area.cor }}
            >
              {question.apoio.texto}
              <footer className="mt-2 text-[11px] not-italic font-mono text-ink-400">
                — {question.apoio.fonte}
              </footer>
            </blockquote>
          )}

          <h2 className="font-display text-[15.5px] sm:text-base font-semibold leading-relaxed text-ink-100 mb-5">
            {question.enunciado}
          </h2>

          {/* alternativas */}
          <div className="space-y-2.5" role="listbox" aria-label="Alternativas">
            {LETRAS.map((letra) => {
              const ehCorreta = letra === question.gabarito;
              const ehEscolhida = letra === letraEscolhida;
              let estilo: CSSProperties = {};
              let classes =
                "group w-full text-left flex items-start gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ";

              if (!respondida) {
                classes +=
                  "border-ink-700 bg-ink-800 hover:border-emer/60 hover:bg-[rgba(47,191,143,0.06)] hover:translate-x-1 active:scale-[0.995] cursor-pointer";
              } else if (ehCorreta) {
                classes += "border-emer/70 bg-[rgba(47,191,143,0.13)]";
                estilo = { boxShadow: "0 0 0 1px rgba(47,191,143,0.35), 0 4px 18px rgba(47,191,143,0.12)" };
              } else if (ehEscolhida) {
                classes += "border-uerj-red-soft/70 bg-[rgba(185,48,65,0.14)] animate-shake";
              } else {
                classes += "border-ink-700/60 bg-ink-800/40 opacity-45";
              }

              return (
                <button
                  key={letra}
                  disabled={respondida || corrigindo}
                  onClick={() => onAnswer(letra)}
                  className={classes}
                  style={estilo}
                >
                  <span
                    className="option-letter shrink-0 w-7 h-7 mt-0.5 rounded-md flex items-center justify-center font-display font-bold text-sm"
                    style={
                      respondida && ehCorreta
                        ? { background: "#2fbf8f", color: "#0c1014" }
                        : respondida && ehEscolhida
                          ? { background: "#b93041", color: "#fff" }
                          : {
                              background: "#223041",
                              color: "#b9c6d6",
                            }
                    }
                  >
                    {letra}
                  </span>
                  <span className="text-[14px] leading-relaxed text-ink-200 pt-0.5">
                    {question.alternativas[letra]}
                  </span>
                  {respondida && ehCorreta && (
                    <span className="ml-auto shrink-0 w-6 h-6 rounded-full bg-emer text-ink-950 flex items-center justify-center animate-pop">
                      <IconCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {respondida && ehEscolhida && !ehCorreta && (
                    <span className="ml-auto shrink-0 w-6 h-6 rounded-full bg-uerj-red text-white flex items-center justify-center animate-pop">
                      <IconCross className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* painel de feedback (retrátil) */}
        <div className={`panel-grid ${respondida ? "open" : ""}`}>
          <div>
            {resultado && (
              <div className="border-t border-ink-700 bg-ink-900/70 px-5 sm:px-6 py-5 space-y-4 animate-panel-in">
                {/* fala da tutora */}
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: resultado.is_correct ? "rgba(47,191,143,0.15)" : "rgba(224,58,72,0.14)",
                      border: `1px solid ${resultado.is_correct ? "rgba(47,191,143,0.45)" : "rgba(224,58,72,0.4)"}`,
                    }}
                  >
                    <IconHeartPulse
                      className={`w-5 h-5 ${resultado.is_correct ? "text-emer" : "text-uerj-red"}`}
                    />
                  </span>
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.16em] mb-0.5"
                      style={{ color: resultado.is_correct ? "#2fbf8f" : "#e03a48" }}
                    >
                      {resultado.is_correct ? "Acertou!" : "Não foi dessa vez"}
                    </div>
                    <p className="text-[14px] leading-relaxed text-ink-100 italic">
                      “{resultado.mensagem_tutor}”
                    </p>
                  </div>
                </div>

                {/* explicação didática */}
                <div className="rounded-lg border border-ink-700 bg-ink-850 p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-uerj-blue mb-2">
                    Por que a {question.gabarito} é a correta
                  </h4>
                  <p className="text-[13.5px] leading-relaxed text-ink-200">
                    {resultado.explicacao_didatica}
                  </p>
                  {resultado.por_que_escolhida_errada && letraEscolhida && (
                    <>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-uerj-red mt-4 mb-2">
                        Por que a sua ({letraEscolhida}) não fecha
                      </h4>
                      <p className="text-[13.5px] leading-relaxed text-ink-200">
                        {resultado.por_que_escolhida_errada}
                      </p>
                    </>
                  )}
                </div>

                {/* dica de ouro */}
                <div
                  className="relative rounded-lg px-4 py-3.5 border overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(232,181,77,0.12), rgba(232,181,77,0.04))",
                    borderColor: "rgba(232,181,77,0.4)",
                  }}
                >
                  <IconStar className="absolute -right-2 -top-2 w-12 h-12 text-uerj-gold/15 rotate-12" />
                  <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-uerj-gold mb-1.5">
                    <IconStar className="w-3.5 h-3.5" />
                    Dica de ouro · estilo UERJ
                  </h4>
                  <p className="text-[13.5px] leading-relaxed text-ink-100">{resultado.dica_de_ouro_uerj}</p>
                </div>

                {/* snapshot de estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { l: "Respondidas", v: String(resultado.estatisticas_aluna.total_respondidas), c: "#b9c6d6" },
                    { l: "Aproveitamento", v: `${resultado.estatisticas_aluna.taxa_aproveitamento.toFixed(1)}%`, c: "#5b8def" },
                    { l: "Conceito", v: resultado.estatisticas_aluna.projecao_conceito, c: "#2fbf8f" },
                    { l: "Erros restantes", v: String(resultado.estatisticas_aluna.margem_erros_restantes), c: "#e8b54d" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-ink-850 border border-ink-700 py-2 px-1">
                      <div className="font-mono font-bold text-base leading-none" style={{ color: s.c }}>
                        {s.v}
                      </div>
                      <div className="text-[9.5px] uppercase tracking-wider text-ink-400 mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onNext}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(47,191,143,0.35)] active:scale-[0.98]"
                >
                  {ehUltima ? "Ver resultado final" : "Avançar para a próxima questão"}
                  <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
