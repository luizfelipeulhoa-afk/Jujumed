import assert from "node:assert/strict";
import test from "node:test";
import {
  LIMITE_AUDIO_BYTES,
  extensaoAudio,
  lerResultadoTranscricao,
  traduzirFalhaGemini,
} from "./estudo";
import { mensagensResumo, resumirTexto } from "./estudo-resumo.server";
import {
  GroqConfigurationError,
  QuizFormatError,
  classificarGroq,
  gerarQuizGroq,
  getGroqKey,
  interpretarQuiz,
} from "./groq.server";
import { handleTranscricao } from "./transcricao.server";

const SEGREDO = "super-secret-value";

function aula(nome: string, tipo: string, bytes = 32) {
  return new File([new Uint8Array(bytes)], nome, { type: tipo });
}

function pedido(arquivo?: File, contentLength?: number) {
  const form = new FormData();
  if (arquivo) form.set("audio", arquivo);
  const headers = new Headers();
  if (contentLength !== undefined) headers.set("content-length", String(contentLength));
  return new Request("http://jujumed.local/api/transcrever", {
    method: "POST",
    headers,
    body: form,
  });
}

test("audio and transcription payloads stay inside the free-tier limits", () => {
  assert.equal(extensaoAudio("aula.webm", "audio/webm;codecs=opus"), ".webm");
  assert.equal(extensaoAudio("recorte.m4a", ""), ".m4a");
  assert.equal(extensaoAudio("prova.pdf", "application/pdf"), null);
  const lido = lerResultadoTranscricao({ ok: true, texto: "  osmose  " });
  assert.deepEqual(lido, { ok: true, texto: "osmose" });
  const invalido = lerResultadoTranscricao({ ok: false, code: "quota", message: "espere" });
  assert.equal(invalido.ok, false);
  assert.equal(lerResultadoTranscricao({ html: SEGREDO }).ok, false);
  assert.equal(JSON.stringify(lerResultadoTranscricao("não-json")).includes(SEGREDO), false);
});

test("Gemini study failures use friendly Portuguese and drop upstream secrets", () => {
  const ausente = traduzirFalhaGemini("missing_key", SEGREDO);
  assert.equal(ausente.code, "missing_key");
  assert.match(ausente.message, /GEMINI_API_KEY/);
  assert.equal(ausente.message.includes(SEGREDO), false);
  const cota = traduzirFalhaGemini("quota", SEGREDO);
  assert.equal(cota.code, "quota");
  assert.match(cota.message, /limite gratuito/);
  assert.equal(cota.message.includes(SEGREDO), false);
  const pedidoResumo = mensagensResumo("A osmose depende da membrana.", "biologia");
  assert.match(pedidoResumo[0]?.content ?? "", /Não invente/);
  assert.match(pedidoResumo[1]?.content ?? "", /A osmose depende da membrana/);
  assert.equal((pedidoResumo[0]?.content ?? "").includes("A osmose depende da membrana"), false);
});

test("quiz JSON accepts letters, fences and skips a broken question", () => {
  const quiz = interpretarQuiz(
    "```json\n" +
      JSON.stringify({
        titulo: "Membrana",
        questoes: [
          { enunciado: "curta", alternativas: ["só uma"], correta: 0, explicacao: "não" },
          {
            enunciado: "O que atravessa a membrana na osmose?",
            alternativas: { A: "Solvente", B: "Somente sal", C: "Proteína", D: "Glicose" },
            correta: "A",
            explicacao: "A osmose é a passagem do solvente.",
          },
        ],
      }) +
      "\n```",
    5,
  );
  assert.equal(quiz.titulo, "Membrana");
  assert.equal(quiz.questoes.length, 1);
  assert.equal(quiz.questoes[0]?.correta, 0);
  assert.equal(quiz.questoes[0]?.alternativas[0], "Solvente");
  assert.throws(() => interpretarQuiz("sem json", 3), QuizFormatError);
});

test("Groq quiz and transcription use the free models and hide the key", async () => {
  const names = ["GROQ_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_API_KEY"];
  const before = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  try {
    names.forEach((name) => delete process.env[name]);
    assert.throws(getGroqKey, GroqConfigurationError);
    const semChave = await handleTranscricao(pedido(aula("aula.webm", "audio/webm")));
    const corpoSemChave = await semChave.json();
    assert.equal(semChave.status, 503);
    assert.equal(corpoSemChave.code, "missing_key");
    assert.match(corpoSemChave.message, /GROQ_API_KEY/);
    assert.equal(JSON.stringify(corpoSemChave).includes(SEGREDO), false);

    const grande = await handleTranscricao(pedido(undefined, LIMITE_AUDIO_BYTES + 2 * 1024 * 1024));
    assert.equal((await grande.json()).code, "arquivo");
    const tipo = await handleTranscricao(pedido(aula("prova.pdf", "application/pdf")));
    assert.equal((await tipo.json()).code, "arquivo");

    process.env["GROQ_API_KEY"] = ` ${SEGREDO} `;
    let chamadasQuiz = 0;
    globalThis.fetch = async (url, init) => {
      chamadasQuiz++;
      assert.equal(String(url), "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(new Headers(init?.headers).get("authorization"), `Bearer ${SEGREDO}`);
      assert.equal(String(url).includes(SEGREDO), false);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "openai/gpt-oss-20b");
      assert.equal(body.reasoning_effort, "low");
      const content =
        chamadasQuiz === 1
          ? "não é json"
          : JSON.stringify({
              titulo: "Osmose",
              questoes: [
                {
                  enunciado: "Qual substância atravessa a membrana na osmose?",
                  alternativas: ["Solvente", "Somente sal", "Proteína", "Glicose"],
                  correta: 0,
                  explicacao: "A osmose é a passagem do solvente.",
                },
              ],
            });
      return Response.json({ choices: [{ message: { content } }] });
    };
    const quiz = await gerarQuizGroq({
      texto: "A osmose é a passagem do solvente pela membrana semipermeável.",
      foco: "biologia",
      quantidade: 3,
    });
    assert.equal(chamadasQuiz, 2);
    assert.equal(quiz.quiz.questoes[0]?.correta, 0);

    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://api.groq.com/openai/v1/audio/transcriptions");
      assert.equal(new Headers(init?.headers).get("authorization"), `Bearer ${SEGREDO}`);
      assert.ok(init?.body instanceof FormData);
      assert.equal(init.body.get("model"), "whisper-large-v3");
      assert.equal(init.body.get("language"), "pt");
      return Response.json({ text: "A osmose depende da membrana." });
    };
    const transcricao = await handleTranscricao(pedido(aula("aula.webm", "audio/webm")));
    const texto = await transcricao.json();
    assert.equal(texto.ok, true);
    assert.equal(texto.texto, "A osmose depende da membrana.");
    assert.equal(JSON.stringify(texto).includes(SEGREDO), false);

    globalThis.fetch = async () => Response.json({ error: { message: SEGREDO } }, { status: 429 });
    await assert.rejects(
      gerarQuizGroq({ texto: "A".repeat(50), foco: "quimica", quantidade: 3 }),
      (error) => {
        const falha = classificarGroq(error);
        assert.equal(falha.code, "quota");
        assert.match(falha.message, /limite gratuito/);
        assert.equal(JSON.stringify(falha).includes(SEGREDO), false);
        return true;
      },
    );

    process.env["GEMINI_API_KEY"] = SEGREDO;
    globalThis.fetch = async (url, init) => {
      assert.equal(
        String(url),
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      );
      assert.equal(new Headers(init?.headers).get("x-goog-api-key"), SEGREDO);
      assert.equal(String(url).includes(SEGREDO), false);
      const body = JSON.parse(String(init?.body));
      assert.match(body.systemInstruction.parts[0].text, /Não invente/);
      return Response.json({
        candidates: [
          {
            content: { parts: [{ text: "Título\n\nIdeias centrais\n• osmose" }] },
            finishReason: "STOP",
          },
        ],
      });
    };
    const resumo = await resumirTexto(
      "A osmose depende da membrana semipermeável e do solvente.",
      "biologia",
    );
    assert.match(resumo.resumo, /osmose/);
    assert.equal(resumo.recortado, false);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
