import { useEffect, useRef, useState } from "react";
import {
  LIMITE_RESUMO,
  MIN_TEXTO_ESTUDO,
  guardarRascunhoEstudo,
  lerResultadoTranscricao,
  type FocoEstudo,
} from "../lib/estudo";
import { MSG_TRANSCRICAO_CONEXAO } from "../lib/estudo-mensagens";
import { resumirConteudo } from "../lib/estudo.functions";
import { IconArrow, IconLoader, IconSpark, IconUpload } from "./icons";
import { AvisoDados, FaixaErro, SeletorFoco } from "./EstudoUi";

interface Props {
  navegar: (rota: string) => void;
}

export default function ResumoView({ navegar }: Props) {
  const [texto, setTexto] = useState("");
  const [foco, setFoco] = useState<FocoEstudo>("biologia");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [gravando, setGravando] = useState(false);
  const [carregando, setCarregando] = useState<"resumo" | "audio" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<string | null>(null);
  const [recortado, setRecortado] = useState(false);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      gravador.current?.stop();
      gravador.current?.stream.getTracks().forEach((trilha) => trilha.stop());
    };
  }, []);

  const atualizarTexto = (valor: string) => {
    setTexto(valor);
    guardarRascunhoEstudo(valor);
  };

  const resumir = async () => {
    if (texto.trim().length < MIN_TEXTO_ESTUDO) {
      setErro(
        "Cole um trecho da aula com pelo menos algumas frases, ou transcreva um áudio primeiro.",
      );
      return;
    }
    setErro(null);
    setCarregando("resumo");
    try {
      const resultado = await resumirConteudo({ data: { texto, foco } });
      if (!resultado.ok) {
        setErro(resultado.message);
        return;
      }
      setResumo(resultado.resumo);
      setRecortado(resultado.recortado);
    } catch {
      setErro("Não consegui completar o resumo. Tente de novo em instantes.");
    } finally {
      setCarregando(null);
    }
  };

  const transcrever = async (origem: File) => {
    setErro(null);
    setCarregando("audio");
    try {
      const dados = new FormData();
      dados.set("audio", origem);
      const resposta = await fetch("/api/transcrever", { method: "POST", body: dados });
      let payload: unknown;
      try {
        payload = await resposta.json();
      } catch {
        setErro(MSG_TRANSCRICAO_CONEXAO);
        return;
      }
      const resultado = lerResultadoTranscricao(payload);
      if (!resultado.ok) {
        setErro(resultado.message);
        return;
      }
      atualizarTexto(resultado.texto);
      setResumo(null);
    } catch {
      setErro(MSG_TRANSCRICAO_CONEXAO);
    } finally {
      setCarregando(null);
    }
  };

  const gravar = async () => {
    if (gravando) {
      gravador.current?.stop();
      setGravando(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      pedacos.current = [];
      rec.ondataavailable = (evento) => {
        if (evento.data.size > 0) pedacos.current.push(evento.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((trilha) => trilha.stop());
        const blob = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        const arquivoGravado = new File([blob], "aula-gravada.webm", { type: blob.type });
        setArquivo(arquivoGravado);
        void transcrever(arquivoGravado);
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
      setErro(null);
    } catch {
      setErro("Não consegui usar o microfone. Você pode enviar um arquivo de áudio da aula.");
    }
  };

  const levarAoQuiz = (origem: string) => {
    guardarRascunhoEstudo(origem);
    navegar("/quiz");
  };

  const ocupado = carregando !== null;

  return (
    <div className="animate-fade-up pb-40">
      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-uerj-blue">
          <IconSpark className="h-4 w-4" /> Para revisar hoje
        </div>
        <h1 className="mb-2 font-display text-2xl font-extrabold tracking-tight text-ink-100 sm:text-[30px]">
          Resumo de aula
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-ink-300">
          Cole anotações ou transcreva uma aula gravada. O Gemini monta um resumo curto no padrão do
          exame discursivo: ideias, termos e uma cadeia explicativa.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-5 rounded-xl border border-ink-700 bg-ink-850 p-5 sm:p-6">
          <AvisoDados gemini />
          <div>
            <label
              htmlFor="texto-resumo"
              className="mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300"
            >
              Anotações ou transcrição
            </label>
            <textarea
              id="texto-resumo"
              rows={6}
              maxLength={20_000}
              value={texto}
              onChange={(event) => atualizarTexto(event.target.value)}
              placeholder="Cole aqui a aula ou suas anotações. Ex.: osmose, potencial de ação, equilíbrio químico, tese de O Bem-Amado."
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-3 text-sm leading-relaxed text-ink-100 outline-none placeholder:text-ink-400 focus:border-emer/70"
            />
            <p className="mt-1.5 text-[11px] text-ink-400">
              {texto.trim().length.toLocaleString("pt-BR")} caracteres · o resumo usa até{" "}
              {LIMITE_RESUMO.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void resumir()}
              disabled={ocupado}
              className="inline-flex items-center gap-2 rounded-lg bg-emer px-5 py-3 text-sm font-bold text-ink-950 disabled:opacity-50"
            >
              {carregando === "resumo" ? (
                <IconLoader className="h-4 w-4 animate-spin" />
              ) : (
                <IconSpark className="h-4 w-4" />
              )}
              {carregando === "resumo"
                ? "Preparando o resumo…"
                : carregando === "audio"
                  ? "Transcrevendo a aula…"
                  : "Gerar resumo"}
            </button>
            <button
              type="button"
              disabled={texto.trim().length < MIN_TEXTO_ESTUDO || ocupado}
              onClick={() => levarAoQuiz(texto)}
              className="inline-flex items-center gap-2 rounded-lg border border-emer/60 px-4 py-3 text-sm font-bold text-emer disabled:opacity-40"
            >
              Quiz com este material <IconArrow className="h-4 w-4" />
            </button>
          </div>

          {erro && (
            <FaixaErro
              mensagem={erro}
              {...(texto.trim().length >= MIN_TEXTO_ESTUDO
                ? { onTentar: () => void resumir() }
                : {})}
            />
          )}

          <div className="rounded-lg border border-dashed border-ink-600 bg-ink-800/50 p-4">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300">
              <IconUpload className="h-4 w-4 text-uerj-gold" /> Áudio da aula
            </p>
            <p className="mb-3 text-[12.5px] leading-relaxed text-ink-300">
              A transcrição usa a Groq (Whisper), na cota gratuita. Não envie gravações com dados
              pessoais. Até 18 MB, em mp3, m4a, wav, ogg, flac ou webm.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void gravar()}
                disabled={ocupado && !gravando}
                className="rounded-lg border border-emer/60 px-4 py-2 text-sm font-bold text-emer disabled:opacity-50"
              >
                {gravando ? "Parar e transcrever" : "Gravar um trecho"}
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={ocupado}
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-bold text-ink-100 disabled:opacity-50"
              >
                Escolher arquivo
              </button>
              {arquivo && !gravando && (
                <button
                  type="button"
                  onClick={() => void transcrever(arquivo)}
                  disabled={ocupado}
                  className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-bold text-ink-100 disabled:opacity-50"
                >
                  Transcrever de novo
                </button>
              )}
            </div>
            {arquivo && (
              <p className="mt-2 text-[12px] text-ink-300">
                {arquivo.name} · {(arquivo.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,video/mp4,video/webm,.mp3,.m4a,.wav,.ogg,.webm,.flac,.mp4"
              className="hidden"
              onChange={(event) => {
                const escolhido = event.target.files?.[0];
                if (escolhido) {
                  setArquivo(escolhido);
                  void transcrever(escolhido);
                }
                event.target.value = "";
              }}
            />
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border border-ink-700 bg-ink-850 p-5">
          <SeletorFoco valor={foco} onChange={setFoco} />
          <p className="text-[12.5px] leading-relaxed text-ink-300">
            O chat do Totem continua no canto da tela, também pelo Gemini. O quiz deste texto fica
            na próxima etapa.
          </p>
          <button
            type="button"
            disabled={texto.trim().length < MIN_TEXTO_ESTUDO}
            onClick={() => levarAoQuiz(texto)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emer/60 px-4 py-2.5 text-sm font-bold text-emer disabled:opacity-40"
          >
            Quiz com este material <IconArrow className="h-4 w-4" />
          </button>
        </aside>
      </div>

      {resumo && (
        <article className="mt-6 rounded-xl border border-emer/40 bg-ink-850 p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emer">
            Resumo pronto
          </p>
          {recortado && (
            <p className="mt-2 text-[12px] text-uerj-gold">
              Usei só o começo do texto para caber na cota gratuita. Se precisar, resuma o restante
              em outra leva.
            </p>
          )}
          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-100">
            {resumo}
          </div>
          <button
            type="button"
            onClick={() => levarAoQuiz(resumo)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emer px-4 py-2.5 text-sm font-bold text-ink-950"
          >
            Quiz com este resumo <IconArrow className="h-4 w-4" />
          </button>
        </article>
      )}
    </div>
  );
}
