import { test } from "node:test";
import assert from "node:assert/strict";
import { generateGeminiReply, getGeminiSettings } from "./gemini-native.server";
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

test("native Google requests handle model discovery, actual response format and quota errors", async () => {
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
    process.env.AI_API_KEY = " test-native-google-key ";
    let generationCalls = 0,
      discoveryCalls = 0;
    globalThis.fetch = async (url, init) => {
      assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-native-google-key");
      assert.ok(!String(url).includes("test-native-google-key"));
      if (String(url).endsWith("models?pageSize=1000")) {
        discoveryCalls++;
        return Response.json({
          models: [
            {
              name: "models/gemini-available-flash-image",
              supportedGenerationMethods: ["generateContent"],
            },
            {
              name: "models/gemini-available-flash",
              supportedGenerationMethods: ["generateContent"],
            },
          ],
        });
      }
      generationCalls++;
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.systemInstruction, { parts: [{ text: "Você é o Totem." }] });
      assert.deepEqual(body.contents, [
        { role: "user", parts: [{ text: "Oi" }, { text: "Tudo bem?" }] },
      ]);
      if (String(url).includes("gemini-3.1-flash-lite:"))
        return Response.json(
          { error: { code: 404, message: "Model not found", status: "NOT_FOUND" } },
          { status: 404 },
        );
      assert.ok(String(url).endsWith("models/gemini-available-flash:generateContent"));
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
    assert.equal(discoveryCalls, 1);
    assert.equal(generationCalls, 2);
    assert.equal(await generateGeminiReply(messages), "Oi, Ju!");
    assert.equal(discoveryCalls, 1);
    assert.equal(generationCalls, 3);

    process.env.GEMINI_MODEL = " models/gemini-custom-flash ";
    globalThis.fetch = async (url) => {
      assert.ok(String(url).endsWith("models/gemini-custom-flash:generateContent"));
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
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
