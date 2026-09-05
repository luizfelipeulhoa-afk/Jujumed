import { AREAS, QUESTIONS } from "../data/questions";
import {
  formatarData,
  formatarTamanho,
  type CadernoEntry,
} from "../lib/caderno";
import {
  ERROS_TOLERADOS,
  META_ACERTOS,
  type EstatisticasAluna,
  type RespostaRegistrada,
} from "../lib/tutor";
import {
  IconArrow,
  IconCheck,
  IconCross,
  IconFileText,
  IconImageFile,
  IconNotebook,
  IconPulse,
  IconReset,
  IconStar,
  IconTrash,
  IconUpload,
} from "./icons";

interface Props {
  stats: EstatisticasAluna;
  respostas: Map<string, RespostaRegistrada>;
  entries: CadernoEntry[];
  onRemoverEntry: (id: string) => void;
  onTreinarQuestao: (id: string) => void;
  onFazerProva: () => void;
  navegar: (rota: string) => void;
}

export default function CadernoView({
  stats,
  respostas,
  entries,
  onRemoverEntry,
  onTreinarQuestao,
  onFazerProva,
  navegar,
}: Props) {
  const errosSimulador = QUESTIONS.filter((q) => {
    const r = respostas.get(q.id);
    return r && !r.is_correct;
  });

  const margemCor =
    stats.margem_erros_restantes <= 5 ? "#e03a48" : stats.margem_erros_restantes <= 11 ? "#e8b54d" : "#2fbf8f";

  const contadores = [
    { l: "Respondidas", v: `${stats.total_respondidas}`, c: "#b9c6d6", nota: "nesta rodada" },
    { l: "Acertos", v: `${stats.acertos}`, c: "#2fbf8f", nota: `meta: ${META_ACERTOS} na prova` },
    {
      l: "Aproveitamento",
      v: stats.total_respondidas === 0 ? "—" : `${stats.taxa_aproveitamento.toFixed(1)}%`,
      c: "#5b8def",
      nota: "≥ 70% = Conceito A",
    },
    {
      l: "Margem de erros",
      v: `${stats.margem_erros_restantes}/${ERROS_TOLERADOS}`,
      c: margemCor,
      nota: "máx. 17 p/ o Conceito A",
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emer mb-1.5 flex items-center gap-2">
          <IconPulse className="w-4 h-4" /> Dashboard de estatísticas
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-[30px] tracking-tight text-ink-100 mb-2">
          Seu raio-X de véspera
        </h2>
        <p className="text-[14px] text-ink-300 leading-relaxed max-w-2xl">
          Números da rodada atual + tudo o que você errou, em cartões de revisão com a Dica de Ouro para não repetir o
          tropeço no domingo.
        </p>
      </div>

      {/* ===== contadores ===== */}
      <section className="rounded-xl border border-ink-700 bg-ink-850 grid grid-cols-2 lg:grid-cols-4 overflow-hidden mb-10">
        {contadores.map((s, i) => (
          <div
            key={s.l}
            className={`px-5 py-5 ${i > 0 ? "border-t sm:border-t-0 border-ink-700" : ""} ${
              i % 2 === 1 ? "border-l border-ink-700" : ""
            } ${i >= 2 ? "sm:border-l sm:border-ink-700" : ""} lg:border-l lg:border-ink-700 lg:first:border-l-0`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">{s.l}</div>
            <div className="font-mono text-[26px] font-bold leading-tight mt-1" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className="text-[11px] text-ink-400 mt-0.5">{s.nota}</div>
          </div>
        ))}
      </section>

      {/* ===== erros do simulador ===== */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <IconNotebook className="w-5 h-5 text-uerj-red" />
          <h3 className="font-display font-extrabold text-xl text-ink-100">Caderno de Erros</h3>
          <span className="rounded-full bg-[rgba(224,58,72,0.15)] border border-uerj-red/50 px-2.5 py-0.5 font-mono text-[11.5px] font-bold text-uerj-red">
            {errosSimulador.length} do simulador
          </span>
        </div>

        {errosSimulador.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3.5">
            {errosSimulador.map((q) => {
              const r = respostas.get(q.id)!;
              const area = AREAS[q.area];
              return (
                <article
                  key={q.id}
                  className="group rounded-xl border border-uerj-red-soft/40 bg-ink-850 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-uerj-red/70 hover:shadow-[0_12px_32px_rgba(185,48,65,0.14)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: area.cor, background: area.corSoft, border: `1px solid ${area.cor}44` }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ background: area.cor }} />
                      {area.nome}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-400 truncate">{q.tema}</span>
                  </div>

                  <p className="text-[13px] text-ink-300 leading-snug mb-3 line-clamp-2">{q.enunciado}</p>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(185,48,65,0.16)] border border-uerj-red-soft/60 px-2.5 py-1 text-[11.5px] font-bold text-uerj-red">
                      <IconCross className="w-3 h-3" /> Você: {r.selected_option}
                    </span>
                    <IconArrow className="w-3.5 h-3.5 text-ink-400" />
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(47,191,143,0.14)] border border-emer/60 px-2.5 py-1 text-[11.5px] font-bold text-emer">
                      <IconCheck className="w-3 h-3" /> Gabarito: {q.gabarito}
                    </span>
                  </div>

                  {r.por_que_escolhida_errada && (
                    <p className="text-[12.5px] text-ink-300 leading-relaxed mb-3">
                      <strong className="text-ink-200">Onde escorregou:</strong> {r.por_que_escolhida_errada}
                    </p>
                  )}

                  <div
                    className="rounded-lg px-3 py-2.5 mb-3.5 border"
                    style={{ background: "rgba(232,181,77,0.08)", borderColor: "rgba(232,181,77,0.35)" }}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-uerj-gold mb-1">
                      <IconStar className="w-3 h-3" /> Dica de Ouro UERJ
                    </div>
                    <p className="text-[12.5px] text-ink-100 leading-relaxed">{q.dicaDeOuro}</p>
                  </div>

                  <button
                    onClick={() => onTreinarQuestao(q.id)}
                    className="group/btn inline-flex items-center gap-2 rounded-lg border border-emer/60 text-emer hover:bg-emer hover:text-ink-950 font-display font-bold text-[12.5px] px-3.5 py-2 transition-all duration-300 active:scale-[0.97]"
                  >
                    <IconReset className="w-3.5 h-3.5 transition-transform duration-500 group-hover/btn:rotate-180" />
                    Treinar esta questão
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-emer/40 bg-[rgba(47,191,143,0.06)] px-6 py-8 text-center">
            <span className="inline-flex w-12 h-12 rounded-full bg-emer text-ink-950 items-center justify-center mb-3 animate-pop">
              <IconCheck className="w-6 h-6" />
            </span>
            <h4 className="font-display font-extrabold text-lg text-ink-100 mb-1">
              {stats.total_respondidas === 0 ? "Nenhum erro — ainda!" : "Gabaritou a rodada!"}
            </h4>
            <p className="text-[13px] text-ink-300 mb-4">
              {stats.total_respondidas === 0
                ? "Faça uma rodada e a tutora guarda aqui cada questão que escapar."
                : "Nenhum cartão de erro para revisar. Aproveite e suba o sarrafo."}
            </p>
            <button
              onClick={onFazerProva}
              className="group inline-flex items-center gap-2 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-[13px] px-5 py-2.5 transition-all active:scale-[0.97]"
            >
              Fazer a Prova de Domingo
              <IconArrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </section>

      {/* ===== dificuldades enviadas ===== */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <IconUpload className="w-5 h-5 text-uerj-blue" />
          <h3 className="font-display font-extrabold text-xl text-ink-100">Dificuldades enviadas por você</h3>
          <span className="rounded-full bg-[rgba(91,141,239,0.15)] border border-uerj-blue/50 px-2.5 py-0.5 font-mono text-[11.5px] font-bold text-uerj-blue">
            {entries.length} upload{entries.length === 1 ? "" : "s"}
          </span>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-3.5">
            {entries.map((e) => (
              <article
                key={e.id}
                className="rounded-xl border border-ink-700 bg-ink-850 p-5 transition-colors hover:border-uerj-blue/50"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-[11px] text-ink-400">{formatarData(e.criadaEm)}</span>
                  {e.arquivos.map((f, i) => (
                    <span
                      key={`${f.nome}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-2 py-1 text-[11px] text-ink-300"
                    >
                      {f.tipo.startsWith("image/") ? (
                        <IconImageFile className="w-3.5 h-3.5 text-uerj-blue" />
                      ) : (
                        <IconFileText className="w-3.5 h-3.5 text-uerj-red" />
                      )}
                      <span className="max-w-[150px] truncate">{f.nome}</span>
                      <span className="font-mono text-[10px] text-ink-400">{formatarTamanho(f.tamanho)}</span>
                    </span>
                  ))}
                  <button
                    onClick={() => onRemoverEntry(e.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-ink-400 hover:text-uerj-red hover:bg-[rgba(224,58,72,0.1)] transition-colors"
                    title="Remover este envio"
                  >
                    <IconTrash className="w-3.5 h-3.5" /> remover
                  </button>
                </div>

                {e.anotacoes && (
                  <blockquote className="border-l-[3px] border-uerj-blue/60 bg-ink-800/60 rounded-r-lg px-4 py-2.5 text-[13px] italic text-ink-200 mb-4">
                    “{e.anotacoes}”
                  </blockquote>
                )}

                {e.dificuldades.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {e.dificuldades.map((d) => {
                      const area = AREAS[d.area];
                      return (
                        <div
                          key={d.area}
                          className="rounded-lg border p-3.5"
                          style={{ borderColor: `${area.cor}44`, background: area.corSoft }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: area.cor }}>
                              {area.nome}
                            </span>
                            <span className="font-mono text-[10.5px] text-ink-300">
                              {d.questoesSugeridas.length} sugerida{d.questoesSugeridas.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {d.termos.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-ink-950/50 px-1.5 py-0.5 font-mono text-[10px] text-ink-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <p className="text-[12px] text-ink-100 leading-relaxed">
                            <strong className="text-uerj-gold">Dica de Ouro:</strong> {d.dicaDeOuro}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-ink-400">
                    A tutora guardou o material, mas não identificou áreas específicas nas anotações — cite os temas
                    (ex.: “equilíbrio químico”, “probabilidade”) para um diagnóstico automático.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-ink-600 px-6 py-8 text-center">
            <IconUpload className="w-8 h-8 text-ink-400 mx-auto mb-3" />
            <h4 className="font-display font-bold text-[15px] text-ink-100 mb-1">Nenhum upload processado ainda</h4>
            <p className="text-[13px] text-ink-400 mb-4 max-w-md mx-auto">
              Manda aquele PDF da prova passada ou uma foto das suas anotações — a tutora transforma em revisão
              dirigida.
            </p>
            <button
              onClick={() => navegar("/enviar")}
              className="group inline-flex items-center gap-2 rounded-lg border border-uerj-blue/60 text-uerj-blue hover:bg-uerj-blue hover:text-ink-950 font-display font-bold text-[13px] px-5 py-2.5 transition-all duration-300 active:scale-[0.97]"
            >
              Enviar prova agora
              <IconArrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
