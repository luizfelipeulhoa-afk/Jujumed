import { useEffect, useState } from "react";
import { GUIA_O_BEM_AMADO, SEMANAS_2027, type Disciplina2027 } from "../data/exame2027";
import {
  bonusDoConceito,
  calcularNotaFinal,
  calcularSomaDiscursivas,
  DATA_EXAME_2027,
  rotuloDisciplina,
  type ConceitoEQ,
  type NotasCadernos,
} from "../lib/exame2027";
import type { RevisaoErro } from "../lib/caderno";
import { IconArrow, IconCalendar, IconNotebook, IconPen, IconStar, IconStetho, IconTarget } from "./icons";

interface Props {
  conceitoEQ: ConceitoEQ;
  notas: NotasCadernos;
  revisoes: RevisaoErro[];
  navegar: (rota: string) => void;
  onAbrirBot?: (pergunta?: string) => void;
}

function Contagem() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const restante = Math.max(0, DATA_EXAME_2027.getTime() - agora);
  const unidades = [
    { l: "dias", v: Math.floor(restante / 86400000) },
    { l: "horas", v: Math.floor(restante / 3600000) % 24 },
    { l: "min", v: Math.floor(restante / 60000) % 60 },
    { l: "seg", v: Math.floor(restante / 1000) % 60 },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {unidades.map((u) => (
        <div key={u.l} className="rounded-lg border border-ink-700 bg-ink-900 p-3 text-center">
          <strong className="block font-mono text-xl text-uerj-gold sm:text-2xl">
            {String(u.v).padStart(2, "0")}
          </strong>
          <span className="text-[9px] uppercase text-ink-400">{u.l}</span>
        </div>
      ))}
    </div>
  );
}

export default function Landing({ conceitoEQ, notas, revisoes, navegar, onAbrirBot }: Props) {
  const final = calcularNotaFinal(conceitoEQ, notas);
  const somaDiscursiva = calcularSomaDiscursivas(notas);
  const pendentes = revisoes.filter((r) => !r.concluidaEm).length;

  const cards: { id: Disciplina2027; desc: string; regra: string; peso: string }[] = [
    {
      id: "biologia",
      desc: "10 questões discursivas por semana",
      regra: "Cada questão vale 2,0 pts (0 a 20 pts)",
      peso: "Peso 2 · Vale até 40,0 pts na nota final",
    },
    {
      id: "quimica",
      desc: "10 questões discursivas por semana",
      regra: "Cada questão vale 2,0 pts (0 a 20 pts)",
      peso: "Peso 1 · Vale até 20,0 pts na nota final",
    },
    {
      id: "redacao",
      desc: "1 tema inédito por semana (20 a 30 linhas)",
      regra: "Baseado na obra O bem-amado (Dias Gomes)",
      peso: "Peso 1 · Vale até 20,0 pts na nota final",
    },
  ];

  return (
    <div className="space-y-12 animate-fade-up">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emer/40 bg-emer/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emer">
            <IconCalendar className="h-4 w-4" /> Prova: 29 de novembro de 2026 · 6 Semanas de Treino
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight text-ink-100 sm:text-5xl">
            Exame Discursivo UERJ 2027 <span className="text-emer">· Medicina</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-300">
            Meta semanal estruturada para a Juju: <strong>10 questões de Biologia (Peso 2)</strong>,{" "}
            <strong>10 questões de Química (Peso 1)</strong> e <strong>1 tema de Redação</strong> por semana, com correção analítica dando nota real (2,0 pts por questão) e a{" "}
            <strong>JujuBot IA</strong> sempre disponível para tirar dúvidas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navegar("/discursivas")}
              className="inline-flex items-center gap-2 rounded-lg bg-emer px-6 py-3.5 font-display text-sm font-bold text-ink-950 hover:brightness-110 transition"
            >
              Começar Simulado da Semana <IconArrow className="h-4 w-4" />
            </button>
            {onAbrirBot && (
              <button
                onClick={() => onAbrirBot()}
                className="inline-flex items-center gap-2 rounded-lg border border-emer/60 bg-ink-850 px-5 py-3.5 font-display text-sm font-bold text-emer hover:bg-emer/10 transition"
              >
                <IconStetho className="h-4 w-4" /> Conversar com a JujuBot IA
              </button>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-850 p-5">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-ink-300">
            Contagem regressiva para o Exame Discursivo
          </p>
          <Contagem />
          <p className="mt-3 text-center text-xs text-ink-400">
            Domingo, 29/11/2026 · {SEMANAS_2027.length} baterias semanais completas disponíveis
          </p>
        </div>
      </section>

      {/* Estrutura Semanal + Pesos */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-uerj-gold">
              Meta semanal · Correção com nota na hora
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-ink-100">
              10 Bio + 10 Química + 1 Redação por semana
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => navegar("/discursivas")}
              className="rounded-xl border border-ink-700 bg-ink-850 p-5 text-left transition hover:-translate-y-1 hover:border-emer"
            >
              <IconPen className="mb-4 h-6 w-6 text-emer" />
              <h3 className="font-display text-xl font-bold text-ink-100">{rotuloDisciplina(c.id)}</h3>
              <p className="mt-2 text-sm text-ink-200">{c.desc}</p>
              <p className="mt-1 text-xs text-ink-400">{c.regra}</p>
              <p className="mt-4 font-mono text-xs font-bold text-uerj-gold">{c.peso}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Projeção de Nota + Guia O Bem-Amado */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border border-ink-700 bg-ink-850 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emer">
            Calculadora Oficial de Nota UERJ
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="font-mono text-5xl font-bold text-ink-100">
              {final === null ? "—" : final.toFixed(1)}
              <span className="text-lg text-ink-400"> / 100</span>
            </div>
            <span className="font-mono text-xs text-uerj-gold">
              (Discursivas: {somaDiscursiva.toFixed(1)} / 80 pts)
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-300">
            Fórmula oficial Medicina:{" "}
            <code className="text-uerj-gold">(Biologia × 2) + Química + Redação + Bônus EQ</code>.
          </p>
          <div className="mt-5 space-y-2.5 border-t border-ink-700 pt-4 text-xs text-ink-300">
            <div className="flex justify-between">
              <span>Biologia (10 × 2,0 pts = {notas.biologia?.toFixed(1) ?? "0.0"}/20) × Peso 2</span>
              <strong className="font-mono text-emer">
                {notas.biologia === null ? "0.0 / 40.0 pts" : `${(notas.biologia * 2).toFixed(1)} / 40.0 pts`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Química (10 × 2,0 pts) × Peso 1</span>
              <strong className="font-mono text-ink-100">
                {notas.quimica === null ? "0.0 / 20.0 pts" : `${notas.quimica.toFixed(1)} / 20.0 pts`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Redação Semanal × Peso 1</span>
              <strong className="font-mono text-ink-100">
                {notas.redacao === null ? "0.0 / 20.0 pts" : `${notas.redacao.toFixed(1)} / 20.0 pts`}
              </strong>
            </div>
            <div className="flex justify-between border-t border-ink-800 pt-2">
              <span>Bônus Exame de Qualificação ({conceitoEQ ? `Conceito ${conceitoEQ}` : "Não definido"})</span>
              <strong className="font-mono text-uerj-gold">
                {conceitoEQ ? `+${bonusDoConceito(conceitoEQ)}.0 pts` : "0.0 pts"}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-uerj-gold/40 bg-ink-850 p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-uerj-gold">
              <IconStar className="h-4 w-4" /> Literatura obrigatória da Redação
            </span>
            {onAbrirBot && (
              <button
                onClick={() => onAbrirBot("Me dá repertórios e citações de O Bem-Amado para usar na redação da UERJ!")}
                className="text-xs font-bold text-emer hover:underline"
              >
                Pedir repertórios ao Bot →
              </button>
            )}
          </div>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-100">
            {GUIA_O_BEM_AMADO.obra} <span className="text-ink-400">· {GUIA_O_BEM_AMADO.autor}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-300">{GUIA_O_BEM_AMADO.guia}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {GUIA_O_BEM_AMADO.eixos.map((e) => (
              <div
                key={e}
                className="flex gap-2 rounded-lg border border-ink-700 bg-ink-800 p-3 text-xs text-ink-200"
              >
                <IconTarget className="h-4 w-4 shrink-0 text-uerj-gold" />
                {e}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caderno de Erros */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-850 p-5">
        <div className="flex items-center gap-3">
          <IconNotebook className="h-6 w-6 text-uerj-red" />
          <div>
            <h2 className="font-display font-bold text-ink-100">Revisão ativa espaçada (3 dias)</h2>
            <p className="text-xs text-ink-400">
              {pendentes} revisão{pendentes === 1 ? "" : "ões"} pendente{pendentes === 1 ? "" : "s"} no Caderno de Erros
            </p>
          </div>
        </div>
        <button
          onClick={() => navegar("/caderno")}
          className="rounded-lg border border-emer/60 px-4 py-2 text-sm font-bold text-emer hover:bg-emer/10"
        >
          Abrir Caderno de Erros
        </button>
      </section>
    </div>
  );
}