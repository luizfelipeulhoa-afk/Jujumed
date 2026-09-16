import { useState } from "react";
import type { QuestaoDiscursiva } from "../data/discursivas";
import { corrigirResposta, type ResultadoCorrecao } from "../lib/corretor";
import {
  IconArrow,
  IconCheck,
  IconCross,
  IconPen,
  IconStar,
  IconTarget,
} from "./icons";

const DISCIPLINA_COR = {
  biologia: { cor: "#4a7c2e", corSoft: "rgba(74,124,46,0.14)" },
  quimica: { cor: "#8b6f47", corSoft: "rgba(139,111,71,0.14)" },
};

interface Props {
  questao: QuestaoDiscursiva;
  ordem: number;
  total: number;
  resultado: ResultadoCorrecao | null;
  resposta: string;
  onResponder: (resposta: string) => void;
  onCorrigir: () => void;
  onNext: () => void;
  corrigindo: boolean;
  ehUltima: boolean;
}

export default function DiscursiveCard({
  questao,
  ordem,
  total,
  resultado,
  resposta,
  onResponder,
  onCorrigir,
  onNext,
  corrigindo,
  ehUltima,
}: Props) {
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const disciplina = DISCIPLINA_COR[questao.disciplina];
  const respondida = resultado !== null;

  const conceitoCor = {
    A: "#4a7c2e",
    B: "#6ba344",
    C: "#d4a574",
    D: "#8b6f47",
    E: "#5c3d2e",
  }[resultado?.conceito ?? "E"];

  return (
    <article className="animate-fade-up">
      {/* cabeçalho */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="font-mono text-[11px] text-ink-400 uppercase tracking-widest">
          Questão discursiva {ordem} / {total}
        </span>
      </div>

      <section className="rounded-xl border border-ink-700 bg-ink-850 overflow-hidden">
        {/* cabeçalho da questão */}
        <div
          className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-ink-700"
          style={{ background: `linear-gradient(90deg, ${disciplina.corSoft}, transparent 65%)` }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              color: disciplina.cor,
              background: disciplina.corSoft,
              border: `1px solid ${disciplina.cor}44`,
            }}
          >
            <IconPen className="w-3.5 h-3.5" />
            {questao.disciplina === "biologia" ? "Biologia" : "Química"} · {questao.tema}
          </span>
          <span className="font-mono text-[11px] text-ink-400 hidden sm:block">{questao.subtema}</span>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {/* apoio */}
          {questao.apoio && (
            <blockquote
              className="mb-4 rounded-r-lg border-l-[3px] bg-ink-800/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink-200 italic"
              style={{ borderColor: disciplina.cor }}
            >
              {questao.apoio.texto}
              <footer className="mt-2 text-[11px] not-italic font-mono text-ink-400">
                — {questao.apoio.fonte}
              </footer>
            </blockquote>
          )}

          {/* comando */}
          <div className="mb-5 rounded-lg border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 flex items-center justify-center" style={{ color: disciplina.cor }}>
                <IconTarget className="w-4 h-4" />
              </span>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300">
                Comando da questão
              </h3>
            </div>
            <p className="text-[14.5px] leading-relaxed text-ink-100 font-medium">{questao.comando}</p>
          </div>

          {/* textarea para resposta */}
          {!respondida && (
            <div className="mb-5">
              <label
                htmlFor={`resposta-${questao.id}`}
                className="block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300 mb-2"
              >
                Sua resposta
              </label>
              <textarea
                id={`resposta-${questao.id}`}
                rows={8}
                value={resposta}
                onChange={(e) => onResponder(e.target.value)}
                disabled={corrigindo}
                placeholder="Escreva sua resposta completa aqui. Seja clara, use terminologia científica e cite os conceitos-chave..."
                className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-[13.5px] leading-relaxed text-ink-100 placeholder:text-ink-400/70 focus:outline-none focus:border-ink-600 focus:ring-2 focus:ring-ink-600/20 transition-all resize-none disabled:opacity-50"
              />
              <div className="flex justify-between text-[11px] text-ink-400 mt-1">
                <span>
                  {resposta.split(/\s+/).filter(Boolean).length} palavras ·{" "}
                  {resposta.length} caracteres
                </span>
                <span>Dica: seja completa e cite os conceitos-chave</span>
              </div>
            </div>
          )}

          {/* botão corrigir */}
          {!respondida && (
            <button
              onClick={onCorrigir}
              disabled={corrigindo || resposta.trim().length < 50}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep disabled:opacity-50 disabled:cursor-not-allowed text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(74,124,46,0.35)] active:scale-[0.97]"
            >
              {corrigindo ? (
                <>
                  <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <IconTarget className="w-4 h-4" />
                  Corrigir com IA
                </>
              )}
            </button>
          )}
        </div>

        {/* painel de feedback (retrátil) */}
        {respondida && resultado && (
          <div className="border-t border-ink-700 bg-ink-900/70 px-5 sm:px-6 py-5 space-y-5 animate-panel-in">
            {/* nota e conceito */}
            <div className="flex items-center gap-4">
              <div
                className="shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center"
                style={{
                  background: `${conceitoCor}1a`,
                  border: `2px solid ${conceitoCor}`,
                }}
              >
                <div className="font-mono text-2xl font-bold" style={{ color: conceitoCor }}>
                  {resultado.notaPercentual}%
                </div>
                <div
                  className="font-display text-xs font-bold uppercase tracking-wider"
                  style={{ color: conceitoCor }}
                >
                  Conceito {resultado.conceito}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-extrabold text-lg text-ink-100 mb-1">
                  Correção da IA
                </h3>
                <p className="text-[13.5px] leading-relaxed text-ink-200">{resultado.feedback}</p>
              </div>
            </div>

            {/* critérios avaliados */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300 mb-3">
                Critérios avaliados
              </h4>
              <div className="space-y-2.5">
                {resultado.criteriosAvaliados.map((c, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 ${
                      c.atingido
                        ? "border-emer/40 bg-[rgba(74,124,46,0.08)]"
                        : "border-uerj-red-soft/40 bg-[rgba(92,61,46,0.08)]"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      {c.atingido ? (
                        <IconCheck className="w-4 h-4 text-emer shrink-0 mt-0.5" />
                      ) : (
                        <IconCross className="w-4 h-4 text-uerj-red shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-[13px] text-ink-200 leading-snug">{c.descricao}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-mono text-[10.5px] text-ink-400">
                            Peso: {(c.peso * 100).toFixed(0)}%
                          </span>
                          <span className="font-mono text-[10.5px]" style={{ color: c.atingido ? "#4a7c2e" : "#8b6f47" }}>
                            Nota: {(c.pontuacao * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {c.palavrasEncontradas.length > 0 && (
                      <div className="ml-6 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emer">
                          Encontrado:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.palavrasEncontradas.map((p) => (
                            <span
                              key={p}
                              className="rounded bg-emer/20 px-1.5 py-0.5 font-mono text-[10px] text-emer"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.palavrasFaltantes.length > 0 && !c.atingido && (
                      <div className="ml-6 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-uerj-red">
                          Faltou:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.palavrasFaltantes.slice(0, 5).map((p) => (
                            <span
                              key={p}
                              className="rounded bg-uerj-red/20 px-1.5 py-0.5 font-mono text-[10px] text-uerj-red"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* pontos fortes e a melhorar */}
            <div className="grid sm:grid-cols-2 gap-3">
              {resultado.pontosFortes.length > 0 && (
                <div className="rounded-lg border border-emer/40 bg-[rgba(74,124,46,0.08)] p-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-emer mb-2">
                    Pontos fortes
                  </h4>
                  <ul className="space-y-1.5">
                    {resultado.pontosFortes.map((p, i) => (
                      <li key={i} className="text-[12px] text-ink-200 leading-snug">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resultado.pontosAMelhorar.length > 0 && (
                <div className="rounded-lg border border-uerj-red-soft/40 bg-[rgba(92,61,46,0.08)] p-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-uerj-red mb-2">
                    Pontos a melhorar
                  </h4>
                  <ul className="space-y-1.5">
                    {resultado.pontosAMelhorar.map((p, i) => (
                      <li key={i} className="text-[12px] text-ink-200 leading-snug">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* gabarito esperado */}
            <div>
              <button
                onClick={() => setMostrarGabarito(!mostrarGabarito)}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300 hover:text-ink-100 transition-colors mb-2"
              >
                <IconStar className="w-3.5 h-3.5 text-uerj-gold" />
                {mostrarGabarito ? "Ocultar" : "Ver"} gabarito esperado
              </button>
              {mostrarGabarito && (
                <div className="rounded-lg border border-uerj-gold/40 bg-[rgba(212,165,116,0.08)] p-4 animate-fade-in">
                  <p className="text-[13px] text-ink-200 leading-relaxed">{questao.gabarito}</p>
                </div>
              )}
            </div>

            {/* dica de ouro */}
            <div
              className="relative rounded-lg px-4 py-3.5 border overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(212,165,116,0.12), rgba(212,165,116,0.04))",
                borderColor: "rgba(212,165,116,0.4)",
              }}
            >
              <IconStar className="absolute -right-2 -top-2 w-12 h-12 text-uerj-gold/15 rotate-12" />
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-uerj-gold mb-1.5">
                <IconStar className="w-3.5 h-3.5" />
                Dica de ouro · estilo UERJ
              </h4>
              <p className="text-[13.5px] leading-relaxed text-ink-100">{questao.dicaDeOuro}</p>
            </div>

            {/* botão próxima */}
            <button
              onClick={onNext}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(74,124,46,0.35)] active:scale-[0.98]"
            >
              {ehUltima ? "Ver resultado final" : "Próxima questão discursiva"}
              <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
