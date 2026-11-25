import { useState } from "react";
import {
  LIMITE_QUIZ,
  MIN_TEXTO_ESTUDO,
  guardarRascunhoEstudo,
  lerRascunhoEstudo,
  type FocoEstudo,
  type QuizGerado,
} from "../lib/estudo";
import { gerarQuiz } from "../lib/estudo.functions";
import { IconArrow, IconCheck, IconLoader, IconTarget } from "./icons";
import { AvisoDados, FaixaErro, SeletorFoco } from "./EstudoUi";

interface Props {
  navegar: (rota: string) => void;
}

const LETRAS = ["A", "B", "C", "D"] as const;

export default function QuizView({ navegar }: Props) {
  const [texto, setTexto] = useState(() => lerRascunhoEstudo());
  const [foco, setFoco] = useState<FocoEstudo>("biologia");
  const [quantidade, setQuantidade] = useState<3 | 5>(5);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizGerado | null>(null);
  const [recortado, setRecortado] = useState(false);
  const [escolhas, setEscolhas] = useState<Record<number, number>>({});

  const gerar = async () => {
    if (texto.trim().length < MIN_TEXTO_ESTUDO) {
      setErro("Cole o resumo ou a transcrição da aula. Dá para trazer o texto da tela de Resumos.");
      return;
    }
    setErro(null);
    setCarregando(true);
    setEscolhas({});
    guardarRascunhoEstudo(texto);
    try {
      const resultado = await gerarQuiz({ data: { texto, foco, quantidade } });
      if (!resultado.ok) {
        setQuiz(null);
        setErro(resultado.message);
        return;
      }
      setQuiz(resultado.quiz);
      setRecortado(resultado.recortado);
    } catch {
      setErro("Não consegui montar o quiz. Tente de novo em instantes.");
    } finally {
      setCarregando(false);
    }
  };

  const acertos = quiz
    ? quiz.questoes.reduce((soma, questao, indice) => {
        const escolha = escolhas[indice];
        return soma + (escolha === questao.correta ? 1 : 0);
      }, 0)
    : 0;
  const respondidas = Object.keys(escolhas).length;

  return (
    <div className="animate-fade-up pb-40">
      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-uerj-gold">
          <IconTarget className="h-4 w-4" /> Treino rápido
        </div>
        <h1 className="mb-2 font-display text-2xl font-extrabold tracking-tight text-ink-100 sm:text-[30px]">
          Quiz da aula
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-300">
          A Groq monta questões de múltipla escolha com gabarito e uma explicação curta. Escolha uma
          alternativa para ver se acertou. A nota do exame discursivo continua sendo a dos cadernos.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <section className="space-y-5 rounded-xl border border-ink-700 bg-ink-850 p-5 sm:p-6">
          <AvisoDados gemini={false} />
          <p className="text-[12.5px] leading-relaxed text-ink-300">
            O quiz usa a Groq na cota gratuita.
          </p>
          <div>
            <label
              htmlFor="texto-quiz"
              className="mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300"
            >
              Texto da aula ou do resumo
            </label>
            <textarea
              id="texto-quiz"
              rows={8}
              maxLength={20_000}
              value={texto}
              onChange={(event) => {
                setTexto(event.target.value);
                guardarRascunhoEstudo(event.target.value);
              }}
              placeholder="Cole a transcrição, as anotações ou o resumo que você acabou de gerar."
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-3 text-sm leading-relaxed text-ink-100 outline-none placeholder:text-ink-400 focus:border-emer/70"
            />
            <p className="mt-1.5 text-[11px] text-ink-400">
              {Math.min(texto.trim().length, LIMITE_QUIZ).toLocaleString("pt-BR")} de{" "}
              {LIMITE_QUIZ.toLocaleString("pt-BR")} caracteres entram no quiz
            </p>
          </div>
          {erro && <FaixaErro mensagem={erro} onTentar={() => void gerar()} />}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void gerar()}
              disabled={carregando}
              className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-50"
            >
              {carregando ? (
                <IconLoader className="h-4 w-4 animate-spin" />
              ) : (
                <IconCheck className="h-4 w-4" />
              )}
              {carregando ? "Montando o quiz…" : "Gerar quiz"}
            </button>
            <button
              type="button"
              onClick={() => navegar("/resumo")}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-600 px-4 py-3 text-sm font-bold text-ink-100"
            >
              Transcrever uma aula <IconArrow className="h-4 w-4" />
            </button>
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border border-ink-700 bg-ink-850 p-5">
          <SeletorFoco valor={foco} onChange={setFoco} />
          <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300">
            Quantidade
            <select
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value === "3" ? 3 : 5)}
              className="mt-2 w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-3 text-sm font-medium normal-case tracking-normal text-ink-100"
            >
              <option value={5}>5 questões</option>
              <option value={3}>3 questões</option>
            </select>
          </label>
          <p className="text-[12px] leading-relaxed text-ink-400">
            Poucas questões de cada vez para caber na cota gratuita da Groq.
          </p>
        </aside>
      </div>

      {quiz && (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emer">
                Quiz pronto
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-ink-100">
                {quiz.titulo}
              </h2>
            </div>
            <p className="font-mono text-sm text-uerj-gold">
              {acertos} de {quiz.questoes.length} certa{acertos === 1 ? "" : "s"}
              {respondidas < quiz.questoes.length
                ? ` · ${respondidas} respondida${respondidas === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
          {recortado && (
            <p className="text-[12px] text-uerj-gold">
              O quiz usou o começo do texto para caber na cota gratuita.
            </p>
          )}
          {quiz.questoes.map((questao, indice) => {
            const escolha = escolhas[indice];
            const revelada = escolha !== undefined;
            return (
              <article
                key={`${questao.enunciado}-${indice}`}
                className="rounded-xl border border-ink-700 bg-ink-850 p-5"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Questão {indice + 1}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink-100">
                  {questao.enunciado}
                </h3>
                <div className="mt-4 grid gap-2">
                  {questao.alternativas.map((alternativa, alternativaIndice) => {
                    const marcada = escolha === alternativaIndice;
                    const correta = alternativaIndice === questao.correta;
                    const classe = !revelada
                      ? "border-ink-600 hover:border-emer"
                      : correta
                        ? "border-emer bg-emer/15"
                        : marcada
                          ? "border-uerj-gold bg-uerj-gold/10"
                          : "border-ink-700 opacity-70";
                    return (
                      <button
                        key={alternativa}
                        type="button"
                        disabled={revelada}
                        onClick={() =>
                          setEscolhas((atual) =>
                            atual[indice] === undefined
                              ? { ...atual, [indice]: alternativaIndice }
                              : atual,
                          )
                        }
                        className={`rounded-lg border px-3 py-2.5 text-left text-sm text-ink-100 transition disabled:cursor-default ${classe}`}
                      >
                        <span className="mr-2 font-mono text-xs text-uerj-gold">
                          {LETRAS[alternativaIndice]}
                        </span>
                        {alternativa}
                      </button>
                    );
                  })}
                </div>
                {revelada && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-200">
                    <strong
                      className={escolha === questao.correta ? "text-emer" : "text-uerj-gold"}
                    >
                      {escolha === questao.correta
                        ? "Certa."
                        : `A resposta é ${LETRAS[questao.correta]}.`}
                    </strong>{" "}
                    {questao.explicacao}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
