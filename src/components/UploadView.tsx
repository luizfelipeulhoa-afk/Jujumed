import { useEffect, useRef, useState, type DragEvent } from "react";
import { AREAS } from "../data/questions";
import {
  PASSOS_PROCESSAMENTO,
  detectarDificuldades,
  formatarTamanho,
  uid,
  type ArquivoRecebido,
  type CadernoEntry,
} from "../lib/caderno";
import {
  IconAlert,
  IconArrow,
  IconCheck,
  IconCross,
  IconFileText,
  IconImageFile,
  IconLoader,
  IconNotebook,
  IconPen,
  IconPulse,
  IconSpark,
  IconStar,
  IconTarget,
  IconUpload,
} from "./icons";

interface Props {
  onProcessar: (entry: CadernoEntry) => void;
  navegar: (rota: string) => void;
  totalEntradas: number;
}

function iconeArquivo(tipo: string) {
  return tipo.startsWith("image/") ? (
    <IconImageFile className="w-4 h-4 text-uerj-blue shrink-0" />
  ) : (
    <IconFileText className="w-4 h-4 text-uerj-red shrink-0" />
  );
}

export default function UploadView({ onProcessar, navegar, totalEntradas }: Props) {
  const [arquivos, setArquivos] = useState<ArquivoRecebido[]>([]);
  const [anotacoes, setAnotacoes] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const [passo, setPasso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<CadernoEntry | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const adicionarArquivos = (lista: FileList | null) => {
    if (!lista || lista.length === 0) return;
    const novos: ArquivoRecebido[] = Array.from(lista).map((f) => ({
      nome: f.name,
      tipo: f.type || "arquivo",
      tamanho: f.size,
    }));
    setArquivos((prev) => [...prev, ...novos]);
    setErro(null);
  };

  const aoSoltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastando(false);
    adicionarArquivos(e.dataTransfer.files);
  };

  const processar = () => {
    if (!arquivos.length && !anotacoes.trim()) {
      setErro("Anexe pelo menos uma prova ou descreva onde ela doeu — a tutora precisa de material para trabalhar.");
      return;
    }
    setErro(null);
    setFeito(null);
    setPasso(0);
    PASSOS_PROCESSAMENTO.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setPasso(i + 1), 620 * (i + 1)));
    });
    timers.current.push(
      window.setTimeout(() => {
        const entry: CadernoEntry = {
          id: uid(),
          criadaEm: new Date().toISOString(),
          arquivos,
          anotacoes: anotacoes.trim(),
          dificuldades: detectarDificuldades(anotacoes),
        };
        onProcessar(entry);
        setFeito(entry);
        setPasso(null);
        setArquivos([]);
        setAnotacoes("");
      }, 620 * PASSOS_PROCESSAMENTO.length + 350),
    );
  };

  const processando = passo !== null;

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-uerj-blue mb-1.5 flex items-center gap-2">
          <IconUpload className="w-4 h-4" /> Sistema de upload
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-[30px] tracking-tight text-ink-100 mb-2">
          Envie suas provas anteriores
        </h2>
        <p className="text-[14px] text-ink-300 leading-relaxed max-w-2xl">
          PDF da prova, foto do caderno de respostas ou só suas anotações sinceras: a tutora lê, identifica as áreas
          fracas e alimenta o <strong className="text-uerj-gold">Caderno de Erros</strong> com cartões de revisão —
          inclusive as questões que ela sugere para o seu Simulado por Upload.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ===== painel principal ===== */}
        <section className="rounded-xl border border-ink-700 bg-ink-850 p-5 sm:p-6">
          {/* dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Área de envio de arquivos"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={aoSoltar}
            className={`rounded-lg border-2 border-dashed px-6 py-9 text-center cursor-pointer transition-all duration-300 ${
              arrastando
                ? "border-emer bg-[rgba(47,191,143,0.09)] scale-[1.01]"
                : "border-ink-600 bg-ink-800/50 hover:border-uerj-blue/70 hover:bg-ink-800"
            }`}
          >
            <IconUpload
              className={`w-9 h-9 mx-auto mb-3 transition-all duration-300 ${
                arrastando ? "text-emer -translate-y-1" : "text-ink-400"
              }`}
            />
            <p className="font-display font-bold text-[15px] text-ink-100 mb-1">
              {arrastando ? "Pode soltar!" : "Arraste PDFs, fotos ou anotações aqui"}
            </p>
            <p className="text-[12px] text-ink-400">
              ou clique para escolher · aceita <span className="font-mono">.pdf .jpg .png .txt</span>
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,image/*,.txt,.md"
              className="hidden"
              onChange={(e) => {
                adicionarArquivos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* arquivos recebidos */}
          {arquivos.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-4 animate-fade-in">
              {arquivos.map((f, i) => (
                <li
                  key={`${f.nome}-${i}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 pl-3 pr-1.5 py-1.5 text-[12px] text-ink-200 animate-pop"
                >
                  {iconeArquivo(f.tipo)}
                  <span className="max-w-[180px] truncate font-medium">{f.nome}</span>
                  <span className="font-mono text-[10.5px] text-ink-400">{formatarTamanho(f.tamanho)}</span>
                  <button
                    onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-ink-400 hover:text-uerj-red hover:bg-[rgba(224,58,72,0.12)] transition-colors"
                    aria-label={`Remover ${f.nome}`}
                  >
                    <IconCross className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* anotações */}
          <div className="mt-6">
            <label htmlFor="anotacoes" className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300 mb-2">
              <IconPen className="w-4 h-4 text-uerj-gold" />
              Onde a prova doeu mais?
            </label>
            <textarea
              id="anotacoes"
              rows={4}
              maxLength={500}
              value={anotacoes}
              onChange={(e) => {
                setAnotacoes(e.target.value);
                setErro(null);
              }}
              placeholder='Ex.: "Travei nas de equilíbrio químico e nas de probabilidade. O Cortiço até fui bem, mas errei uma de Le Chatelier e duas de ecologia…"'
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-[13.5px] leading-relaxed text-ink-100 placeholder:text-ink-400/70 focus:outline-none focus:border-uerj-blue/70 focus:ring-2 focus:ring-uerj-blue/20 transition-all resize-none"
            />
            <div className="flex justify-between text-[11px] text-ink-400 mt-1">
              <span>Quanto mais específica, mais cirúrgica fica a revisão.</span>
              <span className="font-mono">{anotacoes.length}/500</span>
            </div>
          </div>

          {/* erro de validação */}
          {erro && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-[rgba(224,58,72,0.1)] border border-uerj-red/40 px-3.5 py-2.5 animate-shake">
              <IconAlert className="w-4 h-4 text-uerj-red shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-ink-200 leading-snug">{erro}</p>
            </div>
          )}

          {/* ação principal */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={processar}
              disabled={processando}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-emer hover:bg-emer-deep disabled:opacity-60 disabled:cursor-wait text-ink-950 font-display font-bold text-sm px-6 py-3 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(47,191,143,0.4)] active:scale-[0.97]"
            >
              {processando ? (
                <>
                  <IconLoader className="w-4 h-4 animate-spin" /> Processando…
                </>
              ) : (
                <>
                  <IconNotebook className="w-4 h-4" /> Processar e alimentar o Caderno de Erros
                </>
              )}
            </button>
            <span className="text-[11.5px] text-ink-400">
              {totalEntradas} envio{totalEntradas === 1 ? "" : "s"} já processado{totalEntradas === 1 ? "" : "s"}
            </span>
          </div>

          {/* passos do processamento */}
          {processando && (
            <ol className="mt-5 space-y-2 rounded-lg border border-ink-700 bg-ink-800/60 px-4 py-3.5 animate-fade-in">
              {PASSOS_PROCESSAMENTO.map((p, i) => {
                const done = passo! > i;
                const atual = passo === i;
                return (
                  <li key={p} className="flex items-center gap-2.5 text-[12.5px]">
                    {done ? (
                      <IconCheck className="w-4 h-4 text-emer shrink-0" />
                    ) : atual ? (
                      <IconLoader className="w-4 h-4 text-uerj-gold animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-ink-600 shrink-0" />
                    )}
                    <span className={done ? "text-ink-300" : atual ? "text-ink-100 font-semibold" : "text-ink-400"}>
                      {p}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* sucesso */}
          {feito && (
            <div className="mt-6 rounded-xl border border-emer/40 bg-[rgba(47,191,143,0.07)] p-5 animate-panel-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-emer text-ink-950 flex items-center justify-center animate-pop">
                  <IconCheck className="w-4 h-4" />
                </span>
                <h3 className="font-display font-extrabold text-lg text-ink-100">Caderno alimentado!</h3>
              </div>
              {feito.dificuldades.length > 0 ? (
                <>
                  <p className="text-[13.5px] text-ink-200 leading-relaxed mb-3">
                    A tutora mapeou <strong className="text-emer">{feito.dificuldades.length}</strong>{" "}
                    {feito.dificuldades.length === 1 ? "área de dificuldade" : "áreas de dificuldade"} nas suas
                    anotações e anexou a Dica de Ouro de cada uma:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {feito.dificuldades.map((d) => (
                      <span
                        key={d.area}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-bold"
                        style={{ color: AREAS[d.area].cor, background: AREAS[d.area].corSoft, border: `1px solid ${AREAS[d.area].cor}55` }}
                      >
                        <IconSpark className="w-3 h-3" />
                        {AREAS[d.area].nome}
                        <span className="font-mono font-semibold opacity-80">
                          · {d.questoesSugeridas.length} q.
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[13.5px] text-ink-200 leading-relaxed mb-3">
                  A tutora guardou seus arquivos e anotações. Para mapear áreas automaticamente, cite os temas nas
                  anotações — ex.: <em>“equilíbrio químico”</em>, <em>“probabilidade”</em>, <em>“O Cortiço”</em>.
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => navegar("/caderno")}
                  className="group inline-flex items-center gap-2 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-[13px] px-4 py-2.5 transition-all active:scale-[0.97]"
                >
                  Ver no Caderno de Erros
                  <IconArrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => setFeito(null)}
                  className="rounded-lg border border-ink-600 text-ink-200 hover:border-emer/60 font-display font-bold text-[13px] px-4 py-2.5 transition-colors"
                >
                  Enviar outra prova
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ===== coluna explicativa ===== */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-ink-700 bg-ink-850 p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300 mb-4">
              O que a tutora faz com isso
            </h3>
            <ul className="space-y-4">
              {[
                {
                  icone: <IconTarget className="w-4 h-4 text-emer" />,
                  t: "Mapeia as áreas fracas",
                  d: "Suas palavras viram um diagnóstico por área: Literatura, Biologia, Química, Física & Matemática e Humanas.",
                },
                {
                  icone: <IconStar className="w-4 h-4 text-uerj-gold" />,
                  t: "Anexa a Dica de Ouro UERJ",
                  d: "Cada área detectada já vem com o macete de banca para você não errar no domingo.",
                },
                {
                  icone: <IconPulse className="w-4 h-4 text-uerj-red" />,
                  t: "Monta o Simulado por Upload",
                  d: "As questões sugeridas entram na sua fila de treino, prontas para a rodada personalizada.",
                },
              ].map((item) => (
                <li key={item.t} className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center">
                    {item.icone}
                  </span>
                  <span>
                    <span className="block font-display font-bold text-[13px] text-ink-100">{item.t}</span>
                    <span className="block text-[12px] text-ink-400 leading-snug mt-0.5">{item.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-uerj-gold/30 bg-[rgba(232,181,77,0.05)] p-5">
            <p className="text-[12.5px] text-ink-200 leading-relaxed">
              <strong className="text-uerj-gold">Dica da tutora:</strong> escreva como se estivesse desabafando —
              “travei em tal coisa” — porque é exatamente assim que a dificuldade aparece na prova: de surpresa.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
