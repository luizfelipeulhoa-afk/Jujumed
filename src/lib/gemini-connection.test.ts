import { test } from "node:test";
import assert from "node:assert/strict";
import { generateGeminiReply, getGeminiSettings, geminiDiagnostic } from "./gemini-native.server";
import { GeminiConfigurationError, geminiFailure, jujuResponse } from "./gemini-connection";

test("classifies configuration and Google failures without returning upstream secrets", () => {
  const cases: Array<[unknown, string]> = [
    [new GeminiConfigurationError(), "missing_key"],
    [{ statusCode: 400, responseBody: "API_KEY_INVALID test-secret" }, "invalid_key"],
    [{ statusCode: 401 }, "invalid_key"],
    [{ statusCode: 403 }, "permission"],
    [{ statusCode: 404 }, "model"],
    [{ statusCode: 429 }, "quota"],
    [{ name: "TimeoutError" }, "timeout"],
    [{ statusCode: 503 }, "unavailable"],
    [new Error("test-secret"), "connection"],
    [{ lastError: { statusCode: 429 } }, "quota"],
    [{ statusCode: 403, cause: new Error("parser failed") }, "permission"],
    [{ statusCode: 404, cause: new Error("parser failed") }, "model"],
    [{ statusCode: 400, responseBody: "FAILED_PRECONDITION" }, "permission"],
  ];
  for (const [error, code] of cases) {
    const result = geminiFailure(error);
    assert.equal(result.code, code);
    assert.ok(!JSON.stringify(result).includes("test-secret"));
  }
});

test("handles cyclic error causes and passes safe messages through the chat result", () => {
  const error: { cause?: unknown } = {};
  error.cause = error;
  assert.equal(geminiFailure(error).code, "connection");
  assert.equal(jujuResponse({ ok: true, text: "Bom dia, Ju!" }), "Bom dia, Ju!");
  assert.throws(() => jujuResponse(geminiFailure(new GeminiConfigurationError())), /Secret/);
});

test("native Google requests stay on Gemini 3.8 and handle response format and quota errors", async () => {
  const names = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_API_KEY", "GEMINI_MODEL", "AI_MODEL"];
  const before = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const messages = [
    { role: "system" as const, content: "Você é o Totem." },
    { role: "assistant" as const, content: "Bom dia!" },
    { role: "user" as const, content: "Oi" },
    { role: "user" as const, content: "Tudo bem?" },
  ];
  try {
    names.forEach((name) => delete process.env[name]);
    assert.throws(getGeminiSettings, GeminiConfigurationError);
    process.env["AI_API_KEY"] = " test-native-google-key ";
    process.env["GEMINI_MODEL"] = "gemini-3.1-flash-lite";
    process.env["AI_MODEL"] = "gemini-older-model";
    assert.equal(getGeminiSettings().model, "gemini-3.8-flash");
    let generationCalls = 0;
    globalThis.fetch = async (url, init) => {
      generationCalls++;
      assert.equal(
        String(url),
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      );
      assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-native-google-key");
      assert.ok(!String(url).includes("test-native-google-key"));
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.systemInstruction, { parts: [{ text: "Você é o Totem." }] });
      assert.deepEqual(body.contents, [
        { role: "user", parts: [{ text: "Oi" }, { text: "Tudo bem?" }] },
      ]);
      return Response.json({
        candidates: [
          {
            content: { parts: [{ text: "hidden reasoning", thought: true }, { text: "Oi, Ju!" }] },
            finishReason: "STOP",
          },
        ],
      });
    };
    assert.equal(await generateGeminiReply(messages), "Oi, Ju!");
    assert.equal(generationCalls, 1);
    assert.equal(await generateGeminiReply(messages), "Oi, Ju!");
    assert.equal(generationCalls, 2);

    process.env["GEMINI_MODEL"] = " models/gemini-custom-flash ";
    globalThis.fetch = async (url) => {
      assert.ok(String(url).endsWith("models/gemini-3.8-flash:generateContent"));
      return Response.json({ error: { message: "Quota exhausted", code: 429 } }, { status: 429 });
    };
    await assert.rejects(
      generateGeminiReply(messages),
      (error) => geminiFailure(error).code === "quota",
    );

    globalThis.fetch = async () =>
      Response.json(
        { error: { code: 400, message: "API key not valid. test-secret" } },
        { status: 400 },
      );
    await assert.rejects(
      generateGeminiReply(messages),
      (error) =>
        geminiFailure(error).code === "invalid_key" &&
        !JSON.stringify(geminiFailure(error)).includes("test-secret"),
    );
    for (const temporary of ["unavailable", "timeout"]) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls++;
        if (calls === 1) {
          if (temporary === "timeout") throw new DOMException("Simulated delay", "TimeoutError");
          return Response.json({ error: { code: 503, message: "Unavailable" } }, { status: 503 });
        }
        return Response.json({
          candidates: [{ content: { parts: [{ text: "Conexão recuperada" }] } }],
        });
      };
      assert.equal(await generateGeminiReply(messages), "Conexão recuperada");
      assert.equal(calls, 2);
    }
    let quotaCalls = 0;
    globalThis.fetch = async () => {
      quotaCalls++;
      return Response.json({ error: { code: 429, message: "Quota exhausted" } }, { status: 429 });
    };
    await assert.rejects(
      generateGeminiReply(messages),
      (error) => geminiFailure(error).code === "quota",
    );
    assert.equal(quotaCalls, 1);
    let truncatedCalls = 0;
    globalThis.fetch = async (_url, init) => {
      truncatedCalls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.generationConfig.maxOutputTokens, truncatedCalls === 1 ? 4096 : 8192);
      return Response.json(
        truncatedCalls === 1
          ? {
              candidates: [{ finishReason: "MAX_TOKENS" }],
              usageMetadata: { thoughtsTokenCount: 4096 },
            }
          : {
              candidates: [
                { content: { parts: [{ text: "Agora respondi em texto" }] }, finishReason: "STOP" },
              ],
            },
      );
    };
    assert.equal(await generateGeminiReply(messages), "Agora respondi em texto");
    assert.equal(truncatedCalls, 2);

    globalThis.fetch = async () =>
      Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ thought: true, text: "not a user answer" }] },
          },
        ],
      });
    await assert.rejects(generateGeminiReply(messages), (error) => {
      assert.equal(geminiFailure(error).code, "empty_response");
      const diagnostic = geminiDiagnostic(error);
      assert.ok(diagnostic?.includes("empty_response"));
      assert.ok(diagnostic?.includes("STOP"));
      assert.ok(!diagnostic?.includes("test-native-google-key"));
      assert.ok(!diagnostic?.includes("HTTP 502"));
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
