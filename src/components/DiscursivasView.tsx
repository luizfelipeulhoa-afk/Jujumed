import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SEMANAS_2027, obterSemana, type Disciplina2027, type Questao2027 } from "../data/exame2027";
import { avaliarQuestaoCompleta } from "../lib/ai-service";
import { corrigirDiscursivaIA, type ResultadoCorrecaoIA } from "../lib/correcao-ai.functions";
import { criarRevisaoErro, CAUSAS_ERRO, type CausaErro, type RevisaoErro } from "../lib/caderno";
import {
  PESO_DISCIPLINA,
  calcularSomaDiscursivas,
  rotuloDisciplina,
  type NotasCadernos,
} from "../lib/exame2027";
import DiscursiveCard from "./DiscursiveCard";
import { IconArrowLeft, IconCalendar, IconCheck, IconNotebook, IconPulse, IconStetho } from "./icons";

interface Props {
  voltar: () => void;
  notas: NotasCadernos;
  onNotas: (notas: NotasCadernos) => void;
  onRevisao: (revisao: RevisaoErro) => void;
  onQuestaoAtivaChange?: (questao: Questao2027 | null) => void;
  onPerguntarBot?: (pergunta: string) => void;
}

const STORAGE_RESPOSTAS_KEY = "jujumed-respostas-semanais-v1";
const STORAGE_RESULTADOS_KEY = "jujumed-resultados-semanais-v1";

export default function DiscursivasView({
  voltar,
  notas,
  onNotas,
  onRevisao,
  onQuestaoAtivaChange,
  onPerguntarBot,
}: Props) {
  const corrigirNoServidor = useServerFn(corrigirDiscursivaIA);
  const [semanaId, setSemanaId] = useState<string>("semana-1");
  const [caderno, setCaderno] = useState<Disciplina2027 | null>(null);
  const [indice, setIndice] = useState(0);

  const [respostas, setRespostas] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RESPOSTAS_KEY) || "{}") as Record<string, string>;
    } catch {
      return {};
    }
  });

  const [resultados, setResultados] = useState<Record<string, ResultadoCorrecaoIA>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RESULTADOS_KEY) || "{}") as Record<string, ResultadoCorrecaoIA>;
    } catch {
      return {};
    }
  });

  const [corrigindo, setCorrigindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [causa, setCausa] = useState<CausaErro | "">("");
  const [revisaoRegistrada, setRevisaoRegistrada] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RESPOSTAS_KEY, JSON.stringify(respostas));
    } catch {
      /* ignore */
    }
  }, [respostas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RESULTADOS_KEY, JSON.stringify(resultados));
    } catch {
      /* ignore */
    }
  }, [resultados]);

  const semanaAtual = useMemo(() => obterSemana(semanaId), [semanaId]);
  const questoes = caderno ? semanaAtual[caderno] : [];
  const atual = questoes[indice] ?? null;

  useEffect(() => {
    onQuestaoAtivaChange?.(atual);
    return () => onQuestaoAtivaChange?.(null);
  }, [atual, onQuestaoAtivaChange]);

  // Cálculo automático das notas da semana atual
  const resumoSemana = useMemo(() => {
    const calcDisciplina = (disc: Disciplina2027) => {
      const lista = semanaAtual[disc];
      const avaliadas = lista.map((q) => resultados[q.id]).filter((r): r is ResultadoCorrecaoIA => Boolean(r));
      const soma = Math.min(20, Math.round(avaliadas.reduce((acc, r) => acc + r.nota, 0) * 10) / 10);
      return {
        respondidas: avaliadas.length,
        total: lista.length,
        notaBruta: avaliadas.length > 0 ? soma : null,
        notaPonderada: avaliadas.length > 0 ? Math.round(soma * PESO_DISCIPLINA[disc] * 10) / 10 : null,
      };
    };

    const bio = calcDisciplina("biologia");
    const qui = calcDisciplina("quimica");
    const red = calcDisciplina("redacao");

    const notasSemana: NotasCadernos = {
      biologia: bio.notaBruta,
      quimica: qui.notaBruta,
      redacao: red.notaBruta,
    };

    const totalDiscursivoPonderado = calcularSomaDiscursivas(notasSemana);
    return { bio, qui, red, notasSemana, totalDiscursivoPonderado };
  }, [semanaAtual, resultados]);

  const selecionarCaderno = (disciplina: Disciplina2027) => {
    setCaderno(disciplina);
    setIndice(0);
    setErro(null);
    setCausa("");
    setRevisaoRegistrada(false);
  };

  const corrigir = async () => {
    if (!atual) return;
    setCorrigindo(true);
    setErro(null);
    setCausa("");
    setRevisaoRegistrada(false);
    try {
      const resultado = await avaliarQuestaoCompleta(
        atual.id,
        respostas[atual.id] || "",
        corrigirNoServidor,
      );
      const novosResultados = { ...resultados, [atual.id]: resultado };
      setResultados(novosResultados);

      // Atualiza automaticamente a nota do caderno na projeção geral
      if (caderno) {
        const lista = semanaAtual[caderno];
        const somaCaderno = Math.min(
          20,
          Math.round(
            lista.reduce((acc, q) => acc + (novosResultados[q.id]?.nota ?? 0), 0) * 10,
          ) / 10,
        );
        onNotas({ ...notas, [caderno]: somaCaderno });
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a avaliação.");
    } finally {
      setCorrigindo(false);
    }
  };

  const limparNotaQuestao = () => {
    if (!atual) return;
    setResultados((prev) => {
      const copia = { ...prev };
      delete copia[atual.id];
      return copia;
    });
  };

  const avancar = () => {
    if (indice < questoes.length - 1) {
      setIndice((i) => i + 1);
      setCausa("");
      setRevisaoRegistrada(false);
    }
  };

  const registrarRevisao = () => {
    if (!atual || !causa) return;
    onRevisao(
      criarRevisaoErro({
        questaoId: atual.id,
        disciplina: atual.disciplina,
        tema: `${semanaAtual.titulo.split("·")[0]?.trim()} · ${atual.tema}`,
        causa,
      }),
    );
    setRevisaoRegistrada(true);
  };

  const sincronizarNotasSemanaNaProjecao = () => {
    onNotas({
      biologia: resumoSemana.bio.notaBruta ?? notas.biologia,
      quimica: resumoSemana.qui.notaBruta ?? notas.quimica,
      redacao: resumoSemana.red.notaBruta ?? notas.redacao,
    });
  };

  if (!caderno) {
    return (
      <div className="space-y-8 animate-fade-up">
        {/* Cabeçalho e Seletor de Semanas */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emer">
              Cronograma Semanal · Exame Discursivo Medicina UERJ
            </p>
            <h1 className="font-display text-3xl font-extrabold text-ink-100">
              10 Biologia + 10 Química + 1 Redação por Semana
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-300">
              Cada questão discursiva vale <strong>2,0 pontos</strong> (10 questões = 20 pts por caderno).{" "}
              <strong>Biologia tem Peso 2</strong> (até 40 pts), Química tem Peso 1 (até 20 pts) e Redação tem Peso 1 (até 20 pts).
            </p>
          </div>
          {onPerguntarBot && (
            <button
              onClick={() => onPerguntarBot("Me explica como organizar meu treino semanal de Biologia (Peso 2), Química e Redação!")}
              className="inline-flex items-center gap-2 rounded-xl border border-emer bg-emer/10 px-4 py-2.5 text-xs font-bold text-emer hover:bg-emer/20 transition"
            >
              <IconStetho className="h-4 w-4" /> Tirar dúvida com a JujuBot IA
            </button>
          )}
        </div>

        {/* Abas das 6 Semanas */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {SEMANAS_2027.map((s) => {
            const ativa = s.id === semanaId;
            const respondidasSemana = [...s.biologia, ...s.quimica, ...s.redacao].filter(
              (q) => Boolean(resultados[q.id]),
            ).length;
            return (
              <button
                key={s.id}
                onClick={() => setSemanaId(s.id)}
                className={`rounded-xl border p-3.5 text-left transition ${
                  ativa
                    ? "border-emer bg-emer/15 shadow-lg shadow-black/30"
                    : "border-ink-700 bg-ink-850 hover:border-ink-600"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className={ativa ? "text-emer" : "text-ink-400"}>Semana {s.numero}</span>
                  <span className="font-mono text-uerj-gold">{respondidasSemana}/21</span>
                </div>
                <p className="mt-1 font-display text-xs font-bold text-ink-100 truncate">
                  {s.periodo}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-400 truncate">
                  {s.titulo.split("·")[1]?.trim()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Painel de Nota da Semana selecionada */}
        <section className="rounded-xl border border-ink-700 bg-ink-850 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-uerj-gold">
                <IconCalendar className="h-4 w-4" /> {semanaAtual.titulo} ({semanaAtual.periodo})
              </span>
              <p className="mt-1 text-xs text-ink-300">
                As notas abaixo atualizam automaticamente a cada questão corrigida pela IA.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-ink-400">
                  Nota Discursiva da Semana
                </span>
                <strong className="font-mono text-2xl font-extrabold text-emer">
                  {resumoSemana.totalDiscursivoPonderado.toFixed(1)}{" "}
                  <span className="text-xs text-ink-400">/ 80,0 pts</span>
                </strong>
              </div>
              <button
                onClick={sincronizarNotasSemanaNaProjecao}
                className="rounded-lg bg-emer px-3.5 py-2 text-xs font-bold text-ink-950 hover:brightness-110"
              >
                Usar na Projeção Principal
              </button>
            </div>
          </div>

          {/* Os 3 Cadernos da Semana */}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* BIOLOGIA */}
            <button
              onClick={() => selecionarCaderno("biologia")}
              className="group flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900/70 p-5 text-left transition hover:-translate-y-1 hover:border-emer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emer/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emer">
                    PESO 2 · ATÉ 40 PTS
                  </span>
                  <span className="font-mono text-xs text-ink-400">
                    {resumoSemana.bio.respondidas}/10 corrigidas
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-ink-100">Biologia</h2>
                <p className="mt-1 text-xs font-semibold text-uerj-gold">
                  10 questões × 2,0 pts = 20,0 pts (×2 = 40,0 pts)
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-300">{semanaAtual.focoBio}</p>
              </div>
              <div className="mt-5 border-t border-ink-800 pt-3 flex items-center justify-between">
                <span className="font-mono text-xs text-ink-300">
                  {resumoSemana.bio.notaBruta === null
                    ? "Ainda não iniciada"
                    : `Bruta: ${resumoSemana.bio.notaBruta.toFixed(1)}/20`}
                </span>
                <strong className="font-mono text-sm text-emer">
                  {resumoSemana.bio.notaPonderada === null
                    ? "Abrir 10 questões →"
                    : `Com Peso 2: ${resumoSemana.bio.notaPonderada.toFixed(1)} / 40 pts`}
                </strong>
              </div>
            </button>

            {/* QUÍMICA */}
            <button
              onClick={() => selecionarCaderno("quimica")}
              className="group flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900/70 p-5 text-left transition hover:-translate-y-1 hover:border-emer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-uerj-gold/15 px-2.5 py-1 font-mono text-[11px] font-bold text-uerj-gold">
                    PESO 1 · ATÉ 20 PTS
                  </span>
                  <span className="font-mono text-xs text-ink-400">
                    {resumoSemana.qui.respondidas}/10 corrigidas
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-ink-100">Química</h2>
                <p className="mt-1 text-xs font-semibold text-uerj-gold">
                  10 questões × 2,0 pts = 20,0 pts
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-300">{semanaAtual.focoQui}</p>
              </div>
              <div className="mt-5 border-t border-ink-800 pt-3 flex items-center justify-between">
                <span className="font-mono text-xs text-ink-300">
                  {resumoSemana.qui.notaBruta === null ? "Ainda não iniciada" : "Nota acumulada"}
                </span>
                <strong className="font-mono text-sm text-emer">
                  {resumoSemana.qui.notaBruta === null
                    ? "Abrir 10 questões →"
                    : `${resumoSemana.qui.notaBruta.toFixed(1)} / 20 pts`}
                </strong>
              </div>
            </button>

            {/* REDAÇÃO */}
            <button
              onClick={() => selecionarCaderno("redacao")}
              className="group flex flex-col justify-between rounded-xl border border-ink-700 bg-ink-900/70 p-5 text-left transition hover:-translate-y-1 hover:border-emer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-uerj-blue/20 px-2.5 py-1 font-mono text-[11px] font-bold text-uerj-gold">
                    1 TEMA · ATÉ 20 PTS
                  </span>
                  <span className="font-mono text-xs text-ink-400">
                    {resumoSemana.red.respondidas}/1 corrigida
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-ink-100">Redação</h2>
                <p className="mt-1 text-xs font-semibold text-uerj-gold">
                  O bem-amado (Dias Gomes) · 20 a 30 linhas
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-300">{semanaAtual.temaRedacao}</p>
              </div>
              <div className="mt-5 border-t border-ink-800 pt-3 flex items-center justify-between">
                <span className="font-mono text-xs text-ink-300">
                  {resumoSemana.red.notaBruta === null ? "Proposta da semana" : "Nota da redação"}
                </span>
                <strong className="font-mono text-sm text-emer">
                  {resumoSemana.red.notaBruta === null
                    ? "Escrever redação →"
                    : `${resumoSemana.red.notaBruta.toFixed(1)} / 20 pts`}
                </strong>
              </div>
            </button>
          </div>
        </section>
      </div>
    );
  }

  const resultadoAtual = atual ? resultados[atual.id] ?? null : null;
  const infoDisciplina =
    caderno === "biologia"
      ? resumoSemana.bio
      : caderno === "quimica"
      ? resumoSemana.qui
      : resumoSemana.red;

  return (
    <div className="animate-fade-up">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCaderno(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3.5 py-2 text-sm font-semibold text-ink-200 hover:border-emer"
          >
            <IconArrowLeft className="h-4 w-4" /> Voltar aos cadernos da Semana {semanaAtual.numero}
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-ink-400">
            Semana {semanaAtual.numero} ({semanaAtual.periodo}) · Peso {PESO_DISCIPLINA[caderno]}
          </p>
          <h1 className="font-display text-xl font-bold text-ink-100">
            {rotuloDisciplina(caderno)} ·{" "}
            <span className="font-mono text-emer">
              {(infoDisciplina.notaBruta ?? 0).toFixed(1)} / 20,0 pts
            </span>
            {caderno === "biologia" && (
              <span className="ml-2 font-mono text-sm text-uerj-gold">
                (Peso 2: {(infoDisciplina.notaPonderada ?? 0).toFixed(1)} / 40,0 pts)
              </span>
            )}
          </h1>
        </div>
      </header>

      {/* Navegador de Questões 1 a 10 com nota de cada questão */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {questoes.map((q, i) => {
          const resQ = resultados[q.id];
          return (
            <button
              key={q.id}
              onClick={() => setIndice(i)}
              className={`flex min-w-14 flex-col items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-bold transition ${
                i === indice
                  ? "border-emer bg-emer text-ink-950"
                  : resQ
                  ? "border-emer/50 bg-emer/10 text-emer"
                  : "border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600"
              }`}
            >
              <span>Q{i + 1}</span>
              <span className="font-mono text-[10px]">
                {resQ ? `${resQ.nota.toFixed(1)}/${q.pontuacaoMaxima}` : `${q.pontuacaoMaxima.toFixed(0)}pt`}
              </span>
            </button>
          );
        })}
      </div>

      {atual && (
        <DiscursiveCard
          questao={atual}
          ordem={indice + 1}
          total={questoes.length}
          resultado={resultadoAtual}
          resposta={respostas[atual.id] || ""}
          onResponder={(r) => setRespostas((p) => ({ ...p, [atual.id]: r }))}
          onCorrigir={corrigir}
          onRefazer={limparNotaQuestao}
          onNext={avancar}
          onPerguntarBot={onPerguntarBot}
          corrigindo={corrigindo}
          erro={erro}
        />
      )}

      {resultadoAtual && resultadoAtual.nota < resultadoAtual.notaMaxima && (
        <section className="mt-4 rounded-xl border border-uerj-red/40 bg-ink-850 p-5">
          <h3 className="font-display font-bold text-ink-100">
            Adicionar ao Caderno de Erros (Revisão ativa em 3 dias)
          </h3>
          <p className="mt-1 text-xs text-ink-400">
            Você tirou {resultadoAtual.nota.toFixed(1)} de {resultadoAtual.notaMaxima.toFixed(1)} pts. Escolha a causa do erro para agendar a revisão:
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CAUSAS_ERRO.map((item) => (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
                  causa === item ? "border-emer bg-emer/10 text-ink-100" : "border-ink-700 text-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="causa"
                  checked={causa === item}
                  onChange={() => setCausa(item)}
                />
                {item}
              </label>
            ))}
          </div>
          <button
            onClick={registrarRevisao}
            disabled={!causa || revisaoRegistrada}
            className="mt-3 rounded-lg bg-emer px-4 py-2 text-sm font-bold text-ink-950 disabled:opacity-40"
          >
            {revisaoRegistrada ? "✓ Revisão agendada para daqui a 3 dias" : "Agendar revisão no Caderno de Erros"}
          </button>
        </section>
      )}

      {/* Resumo Parcial / Final do Caderno */}
      <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emer/50 bg-emer/5 p-5">
        <div className="flex items-center gap-3">
          <IconCheck className="h-6 w-6 text-emer" />
          <div>
            <h2 className="font-display text-lg font-bold text-ink-100">
              Nota acumulada em {rotuloDisciplina(caderno)} (Semana {semanaAtual.numero}):{" "}
              <span className="font-mono text-emer">{(infoDisciplina.notaBruta ?? 0).toFixed(1)} / 20,0 pts</span>
            </h2>
            <p className="text-xs text-ink-300">
              {caderno === "biologia"
                ? `Com Peso 2 oficial de Medicina, equivale a ${(infoDisciplina.notaPonderada ?? 0).toFixed(1)} de 40,0 pontos na sua Nota Final!`
                : `Questões corrigidas neste caderno: ${infoDisciplina.respondidas} de ${infoDisciplina.total}.`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sincronizarNotasSemanaNaProjecao();
            setCaderno(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-2.5 text-xs font-bold text-ink-950"
        >
          <IconPulse className="h-4 w-4" /> Salvar nota e ver resumo da semana
        </button>
      </section>
    </div>
  );
}