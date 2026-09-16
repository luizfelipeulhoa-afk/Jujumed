import { useState, useMemo } from "react";
import { QUESTOES_DISCURSIVAS, type QuestaoDiscursiva } from "../data/discursivas";
import { corrigirResposta, type ResultadoCorrecao } from "../lib/corretor";
import DiscursiveCard from "./DiscursiveCard";
import { IconArrow, IconArrowLeft, IconCheck, IconPulse, IconStar } from "./icons";

interface Props {
  voltar: () => void;
}

export default function DiscursivasView({ voltar }: Props) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultados, setResultados] = useState<Record<string, ResultadoCorrecao>>({});
  const [corrigindo, setCorrigindo] = useState(false);

  const questaoAtual = QUESTOES_DISCURSIVAS[indiceAtual];
  const total = QUESTOES_DISCURSIVAS.length;

  const estatisticas = useMemo(() => {
    const totalCorrigidas = Object.keys(resultados).length;
    const notas = Object.values(resultados).map((r) => r.nota);
    const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const conceitoGeral =
      media >= 0.9 ? "A" : media >= 0.75 ? "B" : media >= 0.6 ? "C" : media >= 0.4 ? "D" : "E";

    return {
      totalCorrigidas,
      media: Math.round(media * 100),
      conceitoGeral,
    };
  }, [resultados]);

  const responder = (resposta: string) => {
    setRespostas((prev) => ({ ...prev, [questaoAtual.id]: resposta }));
  };

  const corrigir = () => {
    setCorrigindo(true);
    setTimeout(() => {
      const resultado = corrigirResposta(questaoAtual, respostas[questaoAtual.id] || "");
      setResultados((prev) => ({ ...prev, [questaoAtual.id]: resultado }));
      setCorrigindo(false);
    }, 1500);
  };

  const proxima = () => {
    if (indiceAtual < total - 1) {
      setIndiceAtual(indiceAtual + 1);
    }
  };

  const anterior = () => {
    if (indiceAtual > 0) {
      setIndiceAtual(indiceAtual - 1);
    }
  };

  const reiniciar = () => {
    setIndiceAtual(0);
    setRespostas({});
    setResultados({});
  };

  const concluido = Object.keys(resultados).length === total;

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={voltar}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-2.5 sm:px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-ink-100 hover:border-emer/60 transition-colors shrink-0"
          >
            <IconArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Voltar ao Início</span>
            <span className="sm:hidden">Início</span>
          </button>
          <div className="flex items-center gap-2.5">
            <IconPulse className="w-5 h-5 text-emer" />
            <h1 className="font-display font-extrabold text-[15px] text-ink-100">
              Simulado Discursivo · 3ª Fase UERJ
            </h1>
          </div>
          <button
            onClick={reiniciar}
            className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-uerj-red hover:border-uerj-red/60 transition-colors"
          >
            Reiniciar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* estatísticas */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-ink-700 bg-ink-850 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Corrigidas
            </div>
            <div className="font-mono text-2xl font-bold text-ink-100 mt-1">
              {estatisticas.totalCorrigidas}/{total}
            </div>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-850 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Média geral
            </div>
            <div className="font-mono text-2xl font-bold text-emer mt-1">
              {estatisticas.media}%
            </div>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-850 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Conceito
            </div>
            <div
              className="font-display text-2xl font-bold mt-1"
              style={{
                color:
                  estatisticas.conceitoGeral === "A"
                    ? "#4a7c2e"
                    : estatisticas.conceitoGeral === "B"
                      ? "#6ba344"
                      : estatisticas.conceitoGeral === "C"
                        ? "#d4a574"
                        : estatisticas.conceitoGeral === "D"
                          ? "#8b6f47"
                          : "#5c3d2e",
              }}
            >
              {estatisticas.conceitoGeral}
            </div>
          </div>
        </div>

        {/* navegação entre questões */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={anterior}
            disabled={indiceAtual === 0}
            className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-ink-100 hover:border-emer/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
            {QUESTOES_DISCURSIVAS.map((q, i) => {
              const respondida = resultados[q.id] !== undefined;
              const atual = i === indiceAtual;
              return (
                <button
                  key={q.id}
                  onClick={() => setIndiceAtual(i)}
                  className={`shrink-0 w-8 h-8 rounded-md font-mono text-[11px] font-bold transition-all ${
                    atual
                      ? "bg-emer text-ink-950"
                      : respondida
                        ? "bg-emer/20 text-emer border border-emer/40"
                        : "bg-ink-800 text-ink-400 border border-ink-700 hover:border-ink-600"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={proxima}
            disabled={indiceAtual === total - 1}
            className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-300 hover:text-ink-100 hover:border-emer/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Próxima →
          </button>
        </div>

        {/* questão atual */}
        {questaoAtual && (
          <DiscursiveCard
            questao={questaoAtual}
            ordem={indiceAtual + 1}
            total={total}
            resultado={resultados[questaoAtual.id] || null}
            resposta={respostas[questaoAtual.id] || ""}
            onResponder={responder}
            onCorrigir={corrigir}
            onNext={proxima}
            corrigindo={corrigindo}
            ehUltima={indiceAtual === total - 1}
          />
        )}

        {/* tela de conclusão */}
        {concluido && (
          <section className="mt-8 rounded-xl border border-ink-700 bg-ink-850 p-6 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <IconCheck className="w-5 h-5 text-emer" />
              <h2 className="font-display font-extrabold text-xl text-ink-100">
                Simulado concluído!
              </h2>
            </div>
            <p className="text-[14px] text-ink-200 leading-relaxed mb-4">
              Você completou todas as {total} questões discursivas. Sua média foi{" "}
              <strong className="text-emer">{estatisticas.media}%</strong> (Conceito{" "}
              <strong style={{ color: estatisticas.conceitoGeral === "A" ? "#4a7c2e" : "#d4a574" }}>
                {estatisticas.conceitoGeral}
              </strong>
              ).
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {Object.entries(resultados).map(([id, r]) => {
                const q = QUESTOES_DISCURSIVAS.find((x) => x.id === id)!;
                return (
                  <div key={id} className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-300">
                        {q.disciplina === "biologia" ? "Biologia" : "Química"}
                      </span>
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{
                          color:
                            r.conceito === "A" || r.conceito === "B" ? "#4a7c2e" : "#d4a574",
                        }}
                      >
                        {r.notaPercentual}%
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-200 leading-snug">{q.subtema}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={reiniciar}
                className="inline-flex items-center gap-2 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-5 py-2.5 transition-all active:scale-[0.97]"
              >
                Refazer simulado
              </button>
              <button
                onClick={voltar}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 text-ink-200 hover:border-emer/60 font-display font-bold text-sm px-5 py-2.5 transition-colors"
              >
                Voltar ao início
                <IconArrow className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
