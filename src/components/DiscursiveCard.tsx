import type { Questao2027 } from "../data/exame2027";
import type { ResultadoCorrecaoIA } from "../lib/correcao-ai.functions";
import { rotuloDisciplina } from "../lib/exame2027";
import { IconAlert, IconArrow, IconCheck, IconCross, IconStar, IconTarget } from "./icons";

interface Props {
  questao: Questao2027;
  ordem: number;
  total: number;
  resultado: ResultadoCorrecaoIA | null;
  resposta: string;
  onResponder: (resposta: string) => void;
  onCorrigir: () => void;
  onNext: () => void;
  corrigindo: boolean;
  erro: string | null;
}

export default function DiscursiveCard({ questao, ordem, total, resultado, resposta, onResponder, onCorrigir, onNext, corrigindo, erro }: Props) {
  const palavras = resposta.trim().split(/\s+/).filter(Boolean).length;
  const linhas = resposta.split("\n").filter((linha) => linha.trim()).length;
  return (
    <article className="rounded-lg border border-ink-700 bg-ink-850 overflow-hidden animate-fade-up">
      <header className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-800 px-5 py-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emer">{rotuloDisciplina(questao.disciplina)} · questão {ordem}/{total}</p><h2 className="mt-1 font-display text-xl font-extrabold text-ink-100">{questao.tema}</h2></div>
        <span className="font-mono text-sm font-bold text-uerj-gold">{questao.pontuacaoMaxima.toFixed(1)} pts</span>
      </header>
      <div className="p-5 sm:p-6 space-y-5">
        <blockquote className="border-l-[3px] border-uerj-blue bg-ink-800 px-4 py-3 text-sm leading-relaxed text-ink-200">{questao.apoio}</blockquote>
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300"><IconTarget className="h-4 w-4 text-emer"/>Comando</div><p className="text-[15px] leading-relaxed text-ink-100">{questao.comando}</p></div>
        {!resultado && <div><label htmlFor={`resposta-${questao.id}`} className="mb-2 block text-xs font-bold text-ink-200">Sua resposta</label><textarea id={`resposta-${questao.id}`} rows={questao.disciplina === "redacao" ? 16 : 8} value={resposta} onChange={(e) => onResponder(e.target.value)} disabled={corrigindo} placeholder={questao.disciplina === "redacao" ? "Escreva de 20 a 30 linhas, com tese e argumentos articulados..." : "Responda ao comando com uma explicação completa e coerente..."} className="w-full resize-y rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-sm leading-relaxed text-ink-100 focus:border-emer focus:outline-none"/><div className="mt-1 flex justify-between text-[11px] text-ink-400"><span>{palavras} palavras</span>{questao.disciplina === "redacao" && <span>{linhas} linhas preenchidas · meta: 20–30</span>}</div></div>}
        {erro && <div className="flex gap-2 rounded-lg border border-uerj-red/50 bg-uerj-red/10 p-3 text-sm text-ink-100"><IconAlert className="h-4 w-4 shrink-0 text-uerj-red"/>{erro}</div>}
        {!resultado && <button onClick={onCorrigir} disabled={corrigindo || resposta.trim().length < 30} className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 font-display text-sm font-bold text-ink-950 disabled:opacity-40">{corrigindo ? "Avaliando pela rubrica DSEA…" : "Corrigir com IA"}</button>}
        {resultado && <section className="space-y-5 border-t border-ink-700 pt-5">
          <div className="flex items-center gap-4"><div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-emer bg-emer/10"><strong className="font-mono text-2xl text-emer">{resultado.nota.toFixed(1)}</strong><span className="text-[10px] text-ink-300">de {resultado.notaMaxima}</span></div><div><h3 className="font-display text-lg font-bold text-ink-100">Avaliação analítica</h3><p className="text-sm leading-relaxed text-ink-300">{resultado.feedback}</p></div></div>
          {resultado.aviso && <div className="rounded-lg border border-uerj-red bg-uerj-red/10 p-3 font-bold text-uerj-red">{resultado.aviso}</div>}
          <div className="space-y-2">{resultado.criterios.map((c) => <div key={c.descricao} className="rounded-lg border border-ink-700 bg-ink-800 p-3"><div className="flex justify-between gap-3"><span className="text-sm font-semibold text-ink-100">{c.descricao}</span><span className="font-mono text-xs text-uerj-gold">{c.obtido.toFixed(1)} / {c.maximo.toFixed(1)}</span></div><p className="mt-1 text-xs leading-relaxed text-ink-400">{c.justificativa}</p></div>)}</div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-emer/40 bg-emer/5 p-4"><h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emer"><IconCheck className="h-4 w-4"/>Pontos fortes</h4><ul className="space-y-1 text-sm text-ink-200">{resultado.pontosFortes.length ? resultado.pontosFortes.map((p) => <li key={p}>• {p}</li>) : <li>—</li>}</ul></div><div className="rounded-lg border border-uerj-red/40 bg-uerj-red/5 p-4"><h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-uerj-red"><IconCross className="h-4 w-4"/>Para a nota máxima</h4><ul className="space-y-1 text-sm text-ink-200">{resultado.faltouParaNotaMaxima.length ? resultado.faltouParaNotaMaxima.map((p) => <li key={p}>• {p}</li>) : <li>Nenhum item relevante faltou.</li>}</ul></div></div>
          <div className="rounded-lg border border-uerj-gold/40 bg-uerj-gold/5 p-4"><h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-uerj-gold"><IconStar className="h-4 w-4"/>Comparação com o Padrão de Resposta Esperado da Banca DSEA</h4><p className="text-sm leading-relaxed text-ink-200">{resultado.comparacaoDsea}</p><p className="mt-3 border-t border-ink-700 pt-3 text-xs leading-relaxed text-ink-400">{questao.padraoDsea}</p></div>
          <button onClick={onNext} className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 font-display text-sm font-bold text-ink-950">Continuar <IconArrow className="h-4 w-4"/></button>
        </section>}
      </div>
    </article>
  );
}