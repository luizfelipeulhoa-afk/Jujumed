import { AREAS, QUESTIONS, type AreaId } from "../data/questions";
import {
  ERROS_TOLERADOS,
  META_ACERTOS,
  TOTAL_ITENS_PROVA,
  type EstatisticasAluna,
  type RespostaRegistrada,
} from "../lib/tutor";
import { IconFlag, IconTarget } from "./icons";

const CONCEITO_COR: Record<EstatisticasAluna["projecao_conceito"], string> = {
  A: "#2fbf8f",
  B: "#5b8def",
  C: "#e8b54d",
  D: "#e03a48",
};

interface Props {
  stats: EstatisticasAluna;
  respostas: Map<string, RespostaRegistrada>;
}

export function Gauge({ acertos }: { acertos: number }) {
  const pct = Math.min(1, acertos / META_ACERTOS);
  const R = 74;
  const CIRC = Math.PI * R; // semicircunferência
  const filled = CIRC * pct;
  return (
    <svg viewBox="0 0 190 108" className="w-full max-w-[240px] mx-auto">
      <defs>
        <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f9c74" />
          <stop offset="100%" stopColor="#2fbf8f" />
        </linearGradient>
      </defs>
      <path
        d="M 21 100 A 74 74 0 0 1 169 100"
        fill="none"
        stroke="#223041"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M 21 100 A 74 74 0 0 1 169 100"
        fill="none"
        stroke="url(#gaugeFill)"
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC}`}
        className="gauge-arc"
        style={{ filter: pct > 0 ? "drop-shadow(0 0 6px rgba(47,191,143,0.55))" : undefined }}
      />
      {/* marca da meta */}
      <line x1="169" y1="88" x2="169" y2="100" stroke="#e8b54d" strokeWidth="3" strokeLinecap="round" />
      <text x="95" y="72" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="30" fill="#e7edf4">
        {acertos}
      </text>
      <text x="95" y="92" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#8a9bb0">
        de {META_ACERTOS} p/ a meta
      </text>
    </svg>
  );
}

function MargemErros({ erros }: { erros: number }) {
  const blocks = Array.from({ length: ERROS_TOLERADOS });
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          Margem de erros restantes
        </span>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: erros > 12 ? "#e03a48" : erros > 8 ? "#e8b54d" : "#2fbf8f" }}
        >
          {Math.max(0, ERROS_TOLERADOS - erros)}/{ERROS_TOLERADOS}
        </span>
      </div>
      <div className="flex gap-[3px]">
        {blocks.map((_, i) => {
          const consumido = i < erros;
          return (
            <div
              key={i}
              className="h-2.5 flex-1 rounded-[3px] transition-all duration-500"
              style={{
                background: consumido ? "#b93041" : "#1f9c74",
                boxShadow: consumido ? "0 0 6px rgba(185,48,65,0.5)" : "0 0 6px rgba(31,156,116,0.25)",
                opacity: consumido ? 0.9 : 0.55 + 0.45 * (i / ERROS_TOLERADOS),
              }}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        No Exame Discursivo, cada questão vale pontos preciosos. Treine com foco e precisão.
        Cada bloco vermelho é um erro gasto.
      </p>
    </div>
  );
}

function BarrasArea({ respostas }: { respostas: Map<string, RespostaRegistrada> }) {
  const areas = Object.keys(AREAS) as AreaId[];
  return (
    <div className="space-y-2.5">
      {areas.map((area) => {
        const doArea = QUESTIONS.filter((q) => q.area === area);
        const respondidas = doArea.filter((q) => respostas.has(q.id));
        const acertos = respondidas.filter((q) => respostas.get(q.id)!.is_correct).length;
        const pct = respondidas.length ? Math.round((acertos / respondidas.length) * 100) : 0;
        const { cor } = AREAS[area];
        return (
          <div key={area}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-medium text-ink-200">{AREAS[area].nome}</span>
              <span className="font-mono text-ink-400">
                {respondidas.length === 0 ? "—" : `${acertos}/${respondidas.length}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
              <div
                className="h-full rounded-full bar-fill"
                style={{ width: `${pct}%`, background: cor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Thermometer({ stats, respostas }: Props) {
  const corConceito = CONCEITO_COR[stats.projecao_conceito];
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* Termômetro principal */}
      <section className="relative overflow-hidden rounded-xl border border-ink-700 bg-ink-850 p-5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #2fbf8f, transparent)" }}
        />
        <div className="flex items-center gap-2 mb-1">
          <IconTarget className="w-4 h-4 text-emer" />
          <h2 className="font-display font-bold text-sm tracking-wide text-ink-100 uppercase">
            Termômetro de Progresso
          </h2>
        </div>
        <p className="text-[11px] text-ink-400 mb-2">
          Meta: <strong className="text-ink-200">{META_ACERTOS} acertos (≥ 70% de 60)</strong> = bonificação máxima de{" "}
          <strong className="text-emer">+20 pts</strong> na 2ª fase de Medicina.
        </p>

        <Gauge acertos={stats.acertos} />

        <div className="grid grid-cols-3 gap-2 mt-3 mb-4 text-center">
          {[
            { label: "Respondidas", valor: stats.total_respondidas, cor: "#b9c6d6" },
            { label: "Acertos", valor: stats.acertos, cor: "#2fbf8f" },
            { label: "Erros", valor: stats.erros, cor: "#e03a48" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-ink-800 border border-ink-700 py-2">
              <div className="font-mono text-xl font-bold leading-none" style={{ color: s.cor }}>
                {s.valor}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-ink-800 border border-ink-700 px-3 py-2.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-400">Aproveitamento</div>
            <div className="font-mono text-lg font-bold text-ink-100">
              {stats.total_respondidas === 0 ? "—" : `${stats.taxa_aproveitamento.toFixed(1)}%`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-400">Projeção</div>
            <div
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg font-display font-extrabold text-xl transition-colors duration-500"
              style={{
                color: corConceito,
                background: `${corConceito}1f`,
                border: `1px solid ${corConceito}55`,
              }}
            >
              {stats.projecao_conceito}
            </div>
          </div>
        </div>
      </section>

      {/* Margem de erros */}
      <section className="rounded-xl border border-ink-700 bg-ink-850 p-5">
        <MargemErros erros={stats.erros} />
        {stats.faltam_acertos_meta > 0 && stats.total_respondidas > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[rgba(47,191,143,0.08)] border border-[rgba(47,191,143,0.25)] px-3 py-2">
            <IconFlag className="w-4 h-4 text-emer shrink-0 mt-0.5" />
            <p className="text-[12px] text-ink-200 leading-snug">
              Faltam <strong className="text-emer">{stats.faltam_acertos_meta} acertos</strong> para cravar a meta
              dos {META_ACERTOS}. Mantendo esse ritmo, você chega lá.
            </p>
          </div>
        )}
      </section>

      {/* Desempenho por área */}
      <section className="rounded-xl border border-ink-700 bg-ink-850 p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300 mb-3">
          Desempenho por área
        </h3>
        <BarrasArea respostas={respostas} />
        <p className="mt-3 text-[11px] text-ink-400 leading-relaxed">
          Total do treino: <strong className="text-ink-200">{QUESTIONS.length} questões</strong> no padrão dos
          últimos 5 anos da UERJ · {TOTAL_ITENS_PROVA} itens na prova real.
        </p>
      </section>
    </aside>
  );
}
