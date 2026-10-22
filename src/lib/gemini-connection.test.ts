import { test } from "node:test";
import assert from "node:assert/strict";
import { generateText } from "ai";
import { getGeminiChatModel } from "./ai-provider.server";
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

test("the installed SDK sends the Gemini request to Google using the server key", async () => {
  const names = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "AI_API_KEY", "GEMINI_MODEL", "AI_MODEL"];
  const before = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  try {
    names.forEach((name) => delete process.env[name]);
    assert.throws(getGeminiChatModel, GeminiConfigurationError);
    process.env.AI_API_KEY = "  test-google-api-key  ";
    process.env.GEMINI_MODEL = " models/gemini-3.8-flash ";
    globalThis.fetch = async (input, init) => {
      assert.equal(
        String(input),
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      );
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-google-api-key");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "gemini-3.8-flash");
      assert.equal(body.reasoning_effort, "low");
      return Response.json({
        id: "test",
        object: "chat.completion",
        created: 0,
        model: body.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Bom dia, Ju!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });
    };
    const result = await generateText({
      model: getGeminiChatModel(),
      prompt: "Bom dia",
      maxRetries: 0,
      providerOptions: { openai: { reasoningEffort: "low" } },
    });
    assert.equal(result.text, "Bom dia, Ju!");
    globalThis.fetch = async () =>
      Response.json(
        { error: { message: "Quota exhausted", code: 429, status: "RESOURCE_EXHAUSTED" } },
        { status: 429 },
      );
    try {
      await generateText({ model: getGeminiChatModel(), prompt: "Oi", maxRetries: 0 });
      assert.fail("Expected Google quota rejection");
    } catch (error) {
      assert.equal(geminiFailure(error).code, "quota");
    }
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
  }
});
