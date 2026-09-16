import { useEffect, useState } from "react";
import { PROVA_DOMINGO, PROVA_PRIMEIRO_EQ, rotuloProva } from "../data/provas";
import { sugeridasDoCaderno, type CadernoEntry } from "../lib/caderno";
import {
  ERROS_TOLERADOS,
  META_ACERTOS,
  TOTAL_ITENS_PROVA,
  type EstatisticasAluna,
} from "../lib/tutor";
import EcgStrip from "./EcgStrip";
import { Gauge } from "./Thermometer";
import {
  IconAlert,
  IconArrow,
  IconCalendar,
  IconCheck,
  IconNotebook,
  IconPen,
  IconPulse,
  IconSpark,
  IconStar,
  IconStetho,
  IconUpload,
} from "./icons";

interface Props {
  stats: EstatisticasAluna;
  cadernoEntries: CadernoEntry[];
  ultimoErroTema: string | null;
  provaAtiva: { nome: string; respondidas: number; total: number; concluida: boolean } | null;
  onAbrirProva: (ids: string[], nome: string, provaId: string) => void;
  navegar: (rota: string) => void;
}

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const PASSOS_METODO = [
  { n: "1", titulo: "Responda", desc: "questões contextualizadas no padrão exato da UERJ.", cor: "#2fbf8f" },
  { n: "2", titulo: "Correção na hora", desc: "o porquê da certa e da sua alternativa, sem enrolação.", cor: "#5b8def" },
  { n: "3", titulo: "Caderno de Erros", desc: "cada tropeço vira cartão de revisão com Dica de Ouro.", cor: "#e8b54d" },
  { n: "4", titulo: "Conceito A", desc: "+20 pontos de bonificação na 2ª fase de Medicina.", cor: "#e03a48" },
];

export default function Landing({
  stats,
  cadernoEntries,
  ultimoErroTema,
  provaAtiva,
  onAbrirProva,
  navegar,
}: Props) {
  useReveal();
  const [avisoUpload, setAvisoUpload] = useState(false);
  const sugeridas = sugeridasDoCaderno(cadernoEntries);

  const margemCor =
    stats.margem_erros_restantes <= 5 ? "#e03a48" : stats.margem_erros_restantes <= 11 ? "#e8b54d" : "#2fbf8f";

  const abrirUpload = () => {
    if (sugeridas.length === 0) {
      setAvisoUpload(true);
      return;
    }
    onAbrirProva(sugeridas, "Simulado por Upload", "upload");
  };

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="grid lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-10 items-center mb-14 animate-fade-up">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emer/40 bg-[rgba(47,191,143,0.08)] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-emer mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emer animate-pulse-dot" />
            Plantão de estudos · 2º EQ UERJ
          </span>
          <p className="text-[13px] italic text-ink-400 mb-3 font-body">
            ✨ Respire fundo. Você estudou muito. Está no caminho certo.
          </p>
          <h1 className="font-display font-extrabold text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.06] tracking-tight text-ink-100 mb-5">
            Oi, futura médica. Você está a{" "}
            <span className="text-emer relative inline-block">
              2 pontos
              <svg viewBox="0 0 220 12" className="absolute left-0 -bottom-1.5 w-full h-2.5" preserveAspectRatio="none" aria-hidden>
                <path d="M3 9c40-6 140-6 214-2" fill="none" stroke="#2fbf8f" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>{" "}
            do Conceito A.
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-300 max-w-xl mb-7">
            Não é um abismo — é um ajuste fino. Responda no padrão exato da banca, receba a correção na hora com o
            porquê de <em>cada</em> alternativa, e deixe a tutora guardar todo tropeço no seu Caderno de Erros para o
            domingo. Eu fico com a planilha; você fica com a aprovação.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => onAbrirProva(PROVA_DOMINGO.fila, rotuloProva(PROVA_DOMINGO), PROVA_DOMINGO.id)}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-6 py-3.5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(47,191,143,0.4)] active:scale-[0.97]"
            >
              Fazer Prova de Domingo
              <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navegar("/enviar")}
              className="group inline-flex items-center gap-2.5 rounded-lg border border-uerj-blue/50 bg-[rgba(91,141,239,0.07)] hover:border-uerj-blue text-ink-200 hover:text-white font-display font-bold text-sm px-6 py-3.5 transition-all duration-300 active:scale-[0.97]"
            >
              <IconUpload className="w-4 h-4 text-uerj-blue transition-transform duration-300 group-hover:-translate-y-0.5" />
              Enviar prova anterior
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { txt: `+20 pts na 2ª fase`, c: "#2fbf8f" },
              { txt: `meta ${META_ACERTOS}/${TOTAL_ITENS_PROVA} acertos`, c: "#5b8def" },
              { txt: `máx. ${ERROS_TOLERADOS} erros`, c: "#e8b54d" },
            ].map((chip) => (
              <span
                key={chip.txt}
                className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5 font-mono text-[11px] font-semibold"
                style={{ color: chip.c }}
              >
                {chip.txt}
              </span>
            ))}
          </div>
        </div>

        {/* prontuário da sessão */}
        <div
          className="relative rounded-xl border border-ink-700 bg-ink-850 overflow-hidden animate-fade-up"
          style={{ animationDelay: "0.12s" }}
        >
          <EcgStrip className="absolute inset-x-0 top-0 h-9 w-full text-uerj-red/35" />
          <div className="px-5 sm:px-6 pt-7 pb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-300">
                <IconStetho className="w-4 h-4 text-uerj-red" />
                Prontuário da sessão
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emer">
                <span className="w-1.5 h-1.5 rounded-full bg-emer animate-pulse-dot" /> ao vivo
              </span>
            </div>
            <Gauge acertos={stats.acertos} />
            <p className="text-center text-[11px] text-ink-400 -mt-1 mb-4">
              Meta: <strong className="text-ink-200">{META_ACERTOS} acertos</strong> (≥ 70% de {TOTAL_ITENS_PROVA}) ={" "}
              <strong className="text-emer">+20 pts</strong>
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-ink-400">Aproveitamento</div>
                <div className="font-mono text-lg font-bold text-uerj-blue">
                  {stats.total_respondidas === 0 ? "—" : `${stats.taxa_aproveitamento.toFixed(1)}%`}
                </div>
              </div>
              <div className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-ink-400">Margem de erros</div>
                <div className="font-mono text-lg font-bold" style={{ color: margemCor }}>
                  {stats.margem_erros_restantes}/{ERROS_TOLERADOS}
                </div>
              </div>
            </div>
            <div className="border-t border-ink-700 pt-3 space-y-1.5 text-[12px] text-ink-300">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <IconNotebook className="w-3.5 h-3.5 text-uerj-gold" /> Caderno de Erros
                </span>
                <a href="#/caderno" className="font-mono font-bold text-uerj-gold hover:underline">
                  {cadernoEntries.length} envio{cadernoEntries.length === 1 ? "" : "s"}
                </a>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <IconPulse className="w-3.5 h-3.5 text-uerj-red" /> Último erro
                </span>
                {ultimoErroTema ? (
                  <span className="font-semibold text-ink-200 truncate max-w-[180px]">{ultimoErroTema}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emer">
                    <IconCheck className="w-3.5 h-3.5" /> nenhum ainda
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            className="h-1"
            style={{ background: "linear-gradient(90deg, #e03a48, #5b8def 45%, #2fbf8f)" }}
          />
        </div>
      </section>

      {/* ============ PROVAS DISPONÍVEIS ============ */}
      <section className="reveal mb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-uerj-gold mb-1.5 flex items-center gap-2">
              <IconCalendar className="w-4 h-4" /> Rodadas de treino
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[28px] tracking-tight text-ink-100">
              Provas disponíveis
            </h2>
          </div>
          <p className="hidden sm:block text-[12.5px] text-ink-400 max-w-[250px] text-right leading-snug">
            Escolha a rodada — o simulador abre na hora, com correção imediata da tutora.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* destaque: simulado discursivo */}
          <article
            className="group relative lg:col-span-3 rounded-xl border border-emer/35 bg-ink-850 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emer/70 hover:shadow-[0_18px_44px_rgba(74,124,46,0.15)]"
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, #4a7c2e, rgba(74,124,46,0.15))" }}
            />
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(74,124,46,0.15)] border border-emer/50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emer">
                  <IconStar className="w-3.5 h-3.5" /> 3ª Fase · Medicina
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(139,111,71,0.12)] border border-uerj-blue/40 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-uerj-blue">
                  <IconPen className="w-3.5 h-3.5" /> Discursivas com IA
                </span>
              </div>
              <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] leading-tight text-ink-100 mb-1.5">
                Simulado Discursivo{" "}
                <span className="text-emer">Biologia & Química</span>
              </h3>
              <p className="text-[13.5px] text-ink-300 mb-4 leading-relaxed">
                10 questões no padrão exato da 3ª fase UERJ para Medicina. Você escreve a resposta, a{" "}
                <strong className="text-emer">IA corrige em tempo real</strong> com nota, critérios, pontos fortes e
                gabarito esperado. Treino de verdade para a reta final.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {["5 Biologia", "5 Química", "Correção por IA", "Nota 0-100%", "Gabarito UERJ"].map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-ink-800 border border-ink-700 px-2.5 py-1 font-mono text-[10.5px] text-ink-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navegar("/discursivas")}
                className="group/btn inline-flex items-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(74,124,46,0.4)] active:scale-[0.97]"
              >
                Começar simulado discursivo
                <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </article>

          {/* destaque: prova de domingo */}
          <article className="group relative lg:col-span-3 rounded-xl border border-uerj-red/35 bg-ink-850 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-uerj-red/70 hover:shadow-[0_18px_44px_rgba(224,58,72,0.15)]">
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, #e03a48, rgba(224,58,72,0.15))" }}
            />
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(224,58,72,0.15)] border border-uerj-red/50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-uerj-red">
                  <IconCalendar className="w-3.5 h-3.5" /> Domingo · prova oficial
                </span>
                {provaAtiva && provaAtiva.nome === rotuloProva(PROVA_DOMINGO) && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(47,191,143,0.12)] border border-emer/40 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emer">
                    <span className="w-1.5 h-1.5 rounded-full bg-emer animate-pulse-dot" />
                    {provaAtiva.concluida ? "concluída" : "em andamento"}
                  </span>
                )}
              </div>
              <h3 className="font-display font-extrabold text-[24px] sm:text-[28px] leading-tight text-ink-100 mb-1.5">
                UERJ 2026 · 2º EQ <span className="text-uerj-red">(O Cortiço)</span>
              </h3>
              <p className="text-[13.5px] text-ink-300 mb-4 leading-relaxed">
                A rodada nobre: zoomorfização, determinismo do meio, a ascensão de João Romão e a tragédia de
                Bertoleza — mais Biologia, Química, Física, Matemática e Humanas no padrão dos últimos 5 anos.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {[`${PROVA_DOMINGO.fila.length} questões`, "Literatura obrigatória", "5 áreas", "60 itens na prova real"].map(
                  (m) => (
                    <span
                      key={m}
                      className="rounded-md bg-ink-800 border border-ink-700 px-2.5 py-1 font-mono text-[10.5px] text-ink-300"
                    >
                      {m}
                    </span>
                  ),
                )}
              </div>
              {provaAtiva && provaAtiva.nome === rotuloProva(PROVA_DOMINGO) && (
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-ink-400">Progresso da rodada</span>
                    <span className="font-mono text-ink-200">
                      {provaAtiva.respondidas}/{provaAtiva.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bar-fill"
                      style={{
                        width: `${(provaAtiva.respondidas / provaAtiva.total) * 100}%`,
                        background: "#2fbf8f",
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={() => onAbrirProva(PROVA_DOMINGO.fila, rotuloProva(PROVA_DOMINGO), PROVA_DOMINGO.id)}
                className="group/btn inline-flex items-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(47,191,143,0.4)] active:scale-[0.97]"
              >
                Abrir Simulado
                <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </article>

          {/* coluna lateral: 1º EQ + Upload */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <article className="group flex-1 relative rounded-xl border border-uerj-blue/30 bg-ink-850 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-uerj-blue/70 hover:shadow-[0_14px_36px_rgba(91,141,239,0.13)]">
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, #5b8def, rgba(91,141,239,0.1))" }}
              />
              <div className="p-5 sm:p-6 h-full flex flex-col">
                <h3 className="font-display font-extrabold text-lg text-ink-100 mb-1">
                  UERJ 2026 · 1º EQ <span className="text-uerj-blue">(geral)</span>
                </h3>
                <p className="text-[12.5px] text-ink-300 leading-relaxed mb-4 flex-1">{PROVA_PRIMEIRO_EQ.info}.</p>
                <button
                  onClick={() => onAbrirProva(PROVA_PRIMEIRO_EQ.fila, rotuloProva(PROVA_PRIMEIRO_EQ), PROVA_PRIMEIRO_EQ.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-uerj-blue/60 text-uerj-blue hover:bg-uerj-blue hover:text-ink-950 font-display font-bold text-[13px] px-4 py-2.5 transition-all duration-300 active:scale-[0.97]"
                >
                  Abrir Simulado <IconArrow className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>

            <article className="group relative flex-1 rounded-xl border border-uerj-gold/30 bg-ink-850 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-uerj-gold/70 hover:shadow-[0_14px_36px_rgba(232,181,77,0.12)]">
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, #e8b54d, rgba(232,181,77,0.1))" }}
              />
              <div className="p-5 sm:p-6">
                <h3 className="font-display font-extrabold text-lg text-ink-100 mb-1">Simulado por Upload</h3>
                <p className="text-[12.5px] text-ink-300 leading-relaxed mb-3">
                  {sugeridas.length > 0 ? (
                    <>
                      <strong className="text-uerj-gold">{sugeridas.length} questões</strong> sugeridas pelas
                      dificuldades que você enviou.
                    </>
                  ) : (
                    "Envie PDFs, fotos ou anotações de provas — a tutora lê e monta a rodada sob medida."
                  )}
                </p>
                {avisoUpload && sugeridas.length === 0 && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-[rgba(232,181,77,0.1)] border border-uerj-gold/40 px-3 py-2 animate-panel-in">
                    <IconAlert className="w-4 h-4 text-uerj-gold shrink-0 mt-0.5" />
                    <p className="text-[12px] text-ink-200 leading-snug">
                      Nenhum upload processado ainda.{" "}
                      <a href="#/enviar" className="font-bold text-uerj-gold hover:underline">
                        Enviar prova agora →
                      </a>
                    </p>
                  </div>
                )}
                <button
                  onClick={abrirUpload}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-uerj-gold/60 text-uerj-gold hover:bg-uerj-gold hover:text-ink-950 font-display font-bold text-[13px] px-4 py-2.5 transition-all duration-300 active:scale-[0.97]"
                >
                  Abrir Simulado <IconArrow className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ MÉTODO ============ */}
      <section className="reveal rounded-xl border border-ink-700 bg-ink-850 px-6 py-6">
        <div className="flex items-center gap-2 mb-5">
          <IconSpark className="w-4 h-4 text-emer" />
          <h2 className="font-display font-bold text-sm uppercase tracking-[0.14em] text-ink-100">
            O método da tutora
          </h2>
        </div>
        <ol className="grid sm:grid-cols-4 gap-5">
          {PASSOS_METODO.map((p) => (
            <li key={p.n} className="flex items-start gap-3">
              <span
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-display font-extrabold text-sm"
                style={{ color: p.cor, background: `${p.cor}1c`, border: `1px solid ${p.cor}55` }}
              >
                {p.n}
              </span>
              <span>
                <span className="block font-display font-bold text-[13.5px] text-ink-100 leading-tight">
                  {p.titulo}
                </span>
                <span className="block text-[12px] text-ink-400 leading-snug mt-0.5">{p.desc}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 pt-4 border-t border-ink-700 text-[12px] text-ink-400 flex items-center gap-2">
          <IconStar className="w-3.5 h-3.5 text-uerj-gold" />
          Baseado no estilo da Revista Eletrônica do Vestibular UERJ — macete bom é o que se repete no domingo.
        </p>
      </section>
    </div>
  );
}
