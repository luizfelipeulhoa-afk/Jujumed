import { extensaoAudio, LIMITE_AUDIO_BYTES, type ResultadoTranscricao } from "./estudo";
import {
  MSG_AUDIO_GRANDE,
  MSG_AUDIO_TIPO,
  MSG_AUDIO_VAZIO,
  MSG_SEM_ARQUIVO,
} from "./estudo-mensagens";

function json(resultado: ResultadoTranscricao, status = 200) {
  return new Response(JSON.stringify(resultado), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function falha(resultado: Exclude<ResultadoTranscricao, { ok: true }>, status: number) {
  return json(resultado, status);
}

export async function handleTranscricao(request: Request) {
  if (request.method !== "POST") {
    return falha(
      { ok: false, code: "connection", message: "Envie o áudio com o botão Transcrever." },
      405,
    );
  }
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > LIMITE_AUDIO_BYTES + 1024 * 1024) {
    return falha({ ok: false, code: "arquivo", message: MSG_AUDIO_GRANDE }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return falha({ ok: false, code: "arquivo", message: MSG_SEM_ARQUIVO }, 400);
  }
  const bruto = form.get("audio");
  if (!(bruto instanceof File))
    return falha({ ok: false, code: "arquivo", message: MSG_SEM_ARQUIVO }, 400);
  if (bruto.size <= 0) return falha({ ok: false, code: "empty", message: MSG_AUDIO_VAZIO }, 400);
  if (bruto.size > LIMITE_AUDIO_BYTES)
    return falha({ ok: false, code: "arquivo", message: MSG_AUDIO_GRANDE }, 413);
  const extensao = extensaoAudio(bruto.name, bruto.type);
  if (!extensao) return falha({ ok: false, code: "arquivo", message: MSG_AUDIO_TIPO }, 415);

  try {
    const { transcreverGroq } = await import("./groq.server");
    const arquivo = new File([await bruto.arrayBuffer()], `aula${extensao}`, {
      type: bruto.type || "application/octet-stream",
    });
    const texto = await transcreverGroq(arquivo);
    if (!texto) return falha({ ok: false, code: "empty", message: MSG_AUDIO_VAZIO }, 200);
    return json({ ok: true, texto });
  } catch (error) {
    const { classificarGroq } = await import("./groq.server");
    const resultado = classificarGroq(error);
    console.error("[transcricao]", resultado.code);
    const status = resultado.code === "quota" ? 429 : resultado.code === "missing_key" ? 503 : 502;
    return json(resultado, status);
  }
}
