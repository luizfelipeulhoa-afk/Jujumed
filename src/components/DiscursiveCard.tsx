import type { Questao2027 } from "../data/exame2027";
import type { ResultadoCorrecaoIA } from "../lib/correcao-ai.functions";
import { PESO_DISCIPLINA, rotuloDisciplina } from "../lib/exame2027";
import { IconAlert, IconArrow, IconCheck, IconCross, IconSpark, IconStar, IconStetho, IconTarget } from "./icons";

interface Props {
  questao: Questao2027;
  ordem: number;
  total: number;
  resultado: ResultadoCorrecaoIA | null;
  resposta: string;
  onResponder: (resposta: string) => void;
  onCorrigir: () => void;
  onRefazer?: () => void;
  onNext: () => void;
  onPerguntarBot?: (pergunta: string) => void;
  corrigindo: boolean;
  erro: string | null;
}

export default function DiscursiveCard({
  questao,
  ordem,
  total,
  resultado,
  resposta,
  onResponder,
  onCorrigir,
  onRefazer,
  onNext,
  onPerguntarBot,
  corrigindo,
  erro,
}: Props) {
  const palavras = resposta.trim().split(/\s+/).filter(Boolean).length;
  const linhas = resposta.split("\n").filter((linha) => linha.trim()).length;
  const peso = PESO_DISCIPLINA[questao.disciplina];
  const notaPonderada = resultado ? resultado.nota * peso : 0;
  const maxPonderada = questao.pontuacaoMaxima * peso;

  return (
    <article className="rounded-xl border border-ink-700 bg-ink-850 overflow-hidden animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-800 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emer">
            {rotuloDisciplina(questao.disciplina)} · Questão {ordem}/{total} · Peso {peso}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-ink-100">{questao.tema}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-uerj-gold/40 bg-uerj-gold/10 px-3 py-1.5 font-mono text-xs font-bold text-uerj-gold">
            Vale {questao.pontuacaoMaxima.toFixed(1)} pts
            {peso > 1 ? ` (×${peso} = ${maxPonderada.toFixed(1)} pts na nota final)` : ""}
          </span>
        </div>
      </header>

      <div className="p-5 sm:p-6 space-y-5">
        <blockquote className="border-l-[3px] border-uerj-blue bg-ink-800 px-4 py-3 text-sm leading-relaxed text-ink-200">
          {questao.apoio}
        </blockquote>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300">
              <IconTarget className="h-4 w-4 text-emer" /> Comando da Questão
            </span>
            {onPerguntarBot && (
              <button
                type="button"
                onClick={() =>
                  onPerguntarBot(
                    `Me dá uma dica estruturada para responder a questão "${questao.tema}" (${rotuloDisciplina(questao.disciplina)}) sem entregar o gabarito direto!`,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-emer/50 bg-emer/10 px-3 py-1 text-xs font-bold text-emer hover:bg-emer/20 transition"
              >
                <IconStetho className="h-3.5 w-3.5" /> Pedir dica à JujuBot IA
              </button>
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-ink-100">{questao.comando}</p>
        </div>

        {/* Critérios de pontuação visíveis para orientar a resposta */}
        <div className="rounded-lg border border-ink-700/80 bg-ink-900/60 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-2">
            Distribuição dos {questao.pontuacaoMaxima.toFixed(1)} pontos nesta questão:
          </p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {questao.criterios.map((c, i) => (
              <div key={i} className="rounded border border-ink-800 bg-ink-850 px-2.5 py-2 text-xs text-ink-300">
                <strong className="font-mono text-uerj-gold">{c.pontos.toFixed(1)} pt:</strong> {c.descricao}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={`resposta-${questao.id}`} className="mb-2 block text-xs font-bold text-ink-200">
            Sua resposta discursiva
          </label>
          <textarea
            id={`resposta-${questao.id}`}
            rows={questao.disciplina === "redacao" ? 15 : 7}
            value={resposta}
            onChange={(e) => onResponder(e.target.value)}
            disabled={corrigindo}
            placeholder={
              questao.disciplina === "redacao"
                ? "Escreva sua dissertação argumentativa de 20 a 30 linhas, com tese clara e articulação crítica a O bem-amado..."
                : "Escreva sua resposta completa em frases coesas (Causa → Mecanismo → Consequência)..."
            }
            className="w-full resize-y rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-sm leading-relaxed text-ink-100 focus:border-emer focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-[11px] text-ink-400">
            <span>{palavras} palavras digitadas</span>
            {questao.disciplina === "redacao" ? (
              <span>{linhas} parágrafos/linhas · meta UERJ: 20 a 30 linhas</span>
            ) : (
              <span>Mínimo recomendado: 15+ palavras com cadeia causal completa</span>
            )}
          </div>
        </div>

        {erro && (
          <div className="flex gap-2 rounded-lg border border-uerj-red/50 bg-uerj-red/10 p-3 text-sm text-ink-100">
            <IconAlert className="h-4 w-4 shrink-0 text-uerj-red" />
            {erro}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCorrigir}
            disabled={corrigindo || resposta.trim().length < 8}
            className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 font-display text-sm font-bold text-ink-950 disabled:opacity-40 hover:brightness-110 transition"
          >
            <IconSpark className="h-4 w-4" />
            {corrigindo
              ? "Avaliando e calculando sua nota DSEA…"
              : resultado
              ? "Recorrigir resposta com IA"
              : `Corrigir e dar nota (0 a ${questao.pontuacaoMaxima.toFixed(1)} pts)`}
          </button>

          {onPerguntarBot && (
            <button
              type="button"
              onClick={() =>
                onPerguntarBot(
                  resultado
                    ? `Tirei ${resultado.nota.toFixed(1)} de ${resultado.notaMaxima.toFixed(1)} na questão "${questao.tema}". Como posso reescrever minha resposta para fechar a nota máxima?`
                    : `Pode me explicar o conteúdo de "${questao.tema}" cobrado nesta questão da UERJ?`,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-xs font-bold text-ink-200 hover:border-emer hover:text-emer transition"
            >
              <IconStetho className="h-4 w-4 text-emer" />
              {resultado ? "Perguntar à IA como melhorar minha nota" : "Tirar dúvida da matéria com o Bot"}
            </button>
          )}
        </div>

        {resultado && (
          <section className="space-y-5 border-t border-ink-700 pt-5 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emer/40 bg-ink-800/90 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-emer bg-emer/15">
                  <strong className="font-mono text-2xl font-extrabold text-emer">
                    {resultado.nota.toFixed(1)}
                  </strong>
                  <span className="text-[10px] font-semibold text-ink-300">
                    de {resultado.notaMaxima.toFixed(1)} pts
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-ink-100">Nota da Questão</h3>
                    {peso > 1 && (
                      <span className="rounded-md bg-uerj-gold/20 px-2.5 py-0.5 font-mono text-xs font-bold text-uerj-gold">
                        Peso {peso}: +{notaPonderada.toFixed(1)} / {maxPonderada.toFixed(1)} pts na Nota Final
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-300">{resultado.feedback}</p>
                </div>
              </div>
              {onRefazer && (
                <button
                  type="button"
                  onClick={onRefazer}
                  className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-semibold text-ink-300 hover:text-ink-100"
                >
                  Limpar nota
                </button>
              )}
            </div>

            {resultado.aviso && (
              <div className="rounded-lg border border-uerj-red bg-uerj-red/10 p-3 font-bold text-uerj-red">
                {resultado.aviso}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-300">
                Nota detalhada por critério da rubrica:
              </h4>
              {resultado.criterios.map((c) => (
                <div key={c.descricao} className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm font-semibold text-ink-100">{c.descricao}</span>
                    <span className="shrink-0 font-mono text-xs font-bold text-uerj-gold">
                      {c.obtido.toFixed(1)} / {c.maximo.toFixed(1)} pt
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">{c.justificativa}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emer/40 bg-emer/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emer">
                  <IconCheck className="h-4 w-4" /> O que você acertou
                </h4>
                <ul className="space-y-1 text-sm text-ink-200">
                  {resultado.pontosFortes.length ? (
                    resultado.pontosFortes.map((p) => <li key={p}>• {p}</li>)
                  ) : (
                    <li>• Revise os termos essenciais da rubrica.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-uerj-red/40 bg-uerj-red/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-uerj-red">
                  <IconCross className="h-4 w-4" /> O que faltou para fechar {resultado.notaMaxima.toFixed(1)} pts
                </h4>
                <ul className="space-y-1 text-sm text-ink-200">
                  {resultado.faltouParaNotaMaxima.length ? (
                    resultado.faltouParaNotaMaxima.map((p) => <li key={p}>• {p}</li>)
                  ) : (
                    <li>• Nenhum item relevante faltou — nota máxima!</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-uerj-gold/40 bg-uerj-gold/5 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-uerj-gold">
                <IconStar className="h-4 w-4" /> Gabarito Oficial · Padrão de Resposta da Banca DSEA
              </h4>
              <p className="text-sm leading-relaxed text-ink-200">{resultado.comparacaoDsea}</p>
              <p className="mt-3 border-t border-ink-700 pt-3 text-xs leading-relaxed text-ink-300">
                <strong className="text-uerj-gold">Resposta-modelo DSEA:</strong> {questao.padraoDsea}
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button
                onClick={onNext}
                className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 font-display text-sm font-bold text-ink-950"
              >
                Próxima questão <IconArrow className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}