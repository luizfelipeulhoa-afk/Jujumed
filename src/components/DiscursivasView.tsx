import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CADERNOS_2027, type Disciplina2027 } from "../data/exame2027";
import { corrigirDiscursivaIA, type ResultadoCorrecaoIA } from "../lib/correcao-ai.functions";
import { criarRevisaoErro, CAUSAS_ERRO, type CausaErro, type RevisaoErro } from "../lib/caderno";
import { rotuloDisciplina, type NotasCadernos } from "../lib/exame2027";
import DiscursiveCard from "./DiscursiveCard";
import { IconArrowLeft, IconCheck, IconNotebook, IconPulse } from "./icons";

interface Props { voltar: () => void; notas: NotasCadernos; onNotas: (notas: NotasCadernos) => void; onRevisao: (revisao: RevisaoErro) => void; }

export default function DiscursivasView({ voltar, notas, onNotas, onRevisao }: Props) {
  const corrigirNoServidor = useServerFn(corrigirDiscursivaIA);
  const [caderno, setCaderno] = useState<Disciplina2027 | null>(null);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultados, setResultados] = useState<Record<string, ResultadoCorrecaoIA>>({});
  const [corrigindo, setCorrigindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [causa, setCausa] = useState<CausaErro | "">("");
  const [revisaoRegistrada, setRevisaoRegistrada] = useState(false);
  const questoes = caderno ? CADERNOS_2027[caderno] : [];
  const atual = questoes[indice];
  const resultadosDoCaderno = useMemo(() => questoes.map((q) => resultados[q.id]).filter((r): r is ResultadoCorrecaoIA => Boolean(r)), [questoes, resultados]);
  const concluido = questoes.length > 0 && resultadosDoCaderno.length === questoes.length;

  const notaCaderno = useMemo(() => {
    if (!concluido) return null;
    if (caderno === "redacao") return Math.min(20, resultadosDoCaderno[0]?.nota ?? 0);
    return Math.min(20, resultadosDoCaderno.reduce((s, r) => s + r.nota, 0));
  }, [caderno, concluido, resultadosDoCaderno]);

  const selecionar = (disciplina: Disciplina2027) => { setCaderno(disciplina); setIndice(0); setErro(null); setCausa(""); setRevisaoRegistrada(false); };
  const corrigir = async () => {
    if (!atual) return;
    setCorrigindo(true); setErro(null); setCausa(""); setRevisaoRegistrada(false);
    try {
      const resultado = await corrigirNoServidor({ data: { questaoId: atual.id, resposta: respostas[atual.id] || "" } });
      setResultados((prev) => ({ ...prev, [atual.id]: resultado }));
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível concluir a avaliação."); }
    finally { setCorrigindo(false); }
  };
  const avancar = () => { if (indice < questoes.length - 1) { setIndice((i) => i + 1); setCausa(""); setRevisaoRegistrada(false); } };
  const registrarRevisao = () => {
    if (!atual || !causa) return;
    onRevisao(criarRevisaoErro({ questaoId: atual.id, disciplina: atual.disciplina, tema: atual.tema, causa }));
    setRevisaoRegistrada(true);
  };
  const salvarNota = () => { if (!caderno || notaCaderno === null) return; onNotas({ ...notas, [caderno]: notaCaderno }); };

  if (!caderno) return <div className="animate-fade-up"><div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emer">Exame Discursivo · Medicina</p><h1 className="font-display text-3xl font-extrabold text-ink-100">Escolha um caderno</h1><p className="mt-2 max-w-2xl text-sm text-ink-300">Cada prova tem progresso e nota independentes, conforme os pesos oficiais.</p></div><div className="grid gap-4 md:grid-cols-3">{(["biologia","quimica","redacao"] as Disciplina2027[]).map((d) => <button key={d} onClick={() => selecionar(d)} className="group min-h-56 rounded-lg border border-ink-700 bg-ink-850 p-6 text-left transition hover:-translate-y-1 hover:border-emer"><IconNotebook className="mb-5 h-8 w-8 text-emer"/><h2 className="font-display text-2xl font-bold text-ink-100">{rotuloDisciplina(d)}</h2><p className="mt-2 text-sm text-ink-300">{d === "redacao" ? "1 proposta · 20–30 linhas · até 20 pontos" : `10 questões · escala de 0 a 20 · peso ${d === "biologia" ? "2" : "1"}`}</p><div className="mt-6 font-mono text-sm font-bold text-uerj-gold">{notas[d] === null ? "Aguardando diagnóstico" : `Nota registrada: ${notas[d]?.toFixed(1)}`}</div></button>)}</div></div>;

  const resultadoAtual = atual ? resultados[atual.id] ?? null : null;
  return <div className="animate-fade-up"><header className="mb-6 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setCaderno(null)} className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-3 py-2 text-sm text-ink-200"><IconArrowLeft className="h-4 w-4"/>Cadernos</button><div className="text-right"><p className="text-xs uppercase text-ink-400">Prova Discursiva</p><h1 className="font-display text-xl font-bold text-ink-100">{rotuloDisciplina(caderno)}</h1></div></header>
    <div className="mb-5 flex gap-1.5 overflow-x-auto">{questoes.map((q, i) => <button key={q.id} onClick={() => setIndice(i)} className={`h-9 min-w-9 rounded-md border text-xs font-bold ${i === indice ? "border-emer bg-emer text-ink-950" : resultados[q.id] ? "border-emer/50 bg-emer/10 text-emer" : "border-ink-700 bg-ink-850 text-ink-400"}`}>{i + 1}</button>)}</div>
    {atual && <DiscursiveCard questao={atual} ordem={indice + 1} total={questoes.length} resultado={resultadoAtual} resposta={respostas[atual.id] || ""} onResponder={(r) => setRespostas((p) => ({ ...p, [atual.id]: r }))} onCorrigir={corrigir} onNext={avancar} corrigindo={corrigindo} erro={erro}/>} 
    {resultadoAtual && resultadoAtual.nota < resultadoAtual.notaMaxima && <section className="mt-4 rounded-lg border border-uerj-red/40 bg-ink-850 p-5"><h3 className="font-display font-bold text-ink-100">Adicionar ao Caderno de Erros</h3><p className="mt-1 text-xs text-ink-400">Escolha uma causa para agendar a revisão em três dias.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{CAUSAS_ERRO.map((item) => <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${causa === item ? "border-emer bg-emer/10 text-ink-100" : "border-ink-700 text-ink-300"}`}><input type="radio" name="causa" checked={causa === item} onChange={() => setCausa(item)}/>{item}</label>)}</div><button onClick={registrarRevisao} disabled={!causa || revisaoRegistrada} className="mt-3 rounded-lg bg-emer px-4 py-2 text-sm font-bold text-ink-950 disabled:opacity-40">{revisaoRegistrada ? "Revisão agendada" : "Agendar revisão"}</button></section>}
    {concluido && notaCaderno !== null && <section className="mt-5 rounded-lg border border-emer/50 bg-emer/5 p-5"><div className="flex items-center gap-2"><IconCheck className="h-5 w-5 text-emer"/><h2 className="font-display text-xl font-bold text-ink-100">Caderno concluído: {notaCaderno.toFixed(1)} / 20</h2></div><button onClick={salvarNota} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-2.5 font-bold text-ink-950"><IconPulse className="h-4 w-4"/>Salvar na projeção final</button></section>}
  </div>;
}