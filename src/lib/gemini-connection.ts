export type GeminiFailureCode =
  | "missing_key"
  | "invalid_key"
  | "permission"
  | "model"
  | "quota"
  | "timeout"
  | "unavailable"
  | "connection";
export type JujuChatResult =
  { ok: true; text: string } | { ok: false; code: GeminiFailureCode; message: string };

export class GeminiConfigurationError extends Error {
  constructor() {
    super("Gemini API key missing");
    this.name = "GeminiConfigurationError";
  }
}

/** Send only a known, actionable message to the browser, never provider payloads or secrets. */
export function geminiFailure(error: unknown): Extract<JujuChatResult, { ok: false }> {
  let current = error;
  let httpError: unknown;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const value = current as { statusCode?: number; lastError?: unknown; cause?: unknown };
    if (typeof value.statusCode === "number") httpError = current;
    if (value.lastError) current = value.lastError;
    else if (value.cause) current = value.cause;
    else break;
  }
  const value =
    (httpError ?? current) && typeof (httpError ?? current) === "object"
      ? ((httpError ?? current) as {
          name?: string;
          statusCode?: number;
          message?: string;
          responseBody?: string;
        })
      : {};
  const fail = (code: GeminiFailureCode, message: string) => ({
    ok: false as const,
    code,
    message,
  });
  if (error instanceof GeminiConfigurationError || current instanceof GeminiConfigurationError)
    return fail(
      "missing_key",
      "A chave do Gemini não está disponível no Worker. Cadastre AI_API_KEY ou GEMINI_API_KEY como Secret em Cloudflare → jujumed → Settings → Variables and Secrets, e publique. Uma variável apenas de build não basta.",
    );
  // Inspect only for classification; the upstream text is never returned to the client.
  const detail = `${value.message ?? ""} ${value.responseBody ?? ""}`;
  if (
    value.statusCode === 401 ||
    (value.statusCode === 400 && /API_KEY_INVALID|API key not valid|API_KEY_EXPIRED/i.test(detail))
  )
    return fail(
      "invalid_key",
      "O Google recusou a chave do Gemini. Atualize o Secret AI_API_KEY ou GEMINI_API_KEY com uma chave válida do Google AI Studio e publique.",
    );
  if (value.statusCode === 403)
    return fail(
      "permission",
      "A chave foi recusada por permissão ou restrição. Confira no Google AI Studio se o projeto tem acesso à Gemini API e se a chave permite chamadas pelo servidor.",
    );
  if (value.statusCode === 404)
    return fail(
      "model",
      "O modelo configurado não está disponível para esta chave. Confira GEMINI_MODEL no Cloudflare e escolha um modelo disponível no Google AI Studio.",
    );
  if (
    value.statusCode === 400 &&
    /FAILED_PRECONDITION|not available in your country|location is not supported/i.test(detail)
  )
    return fail(
      "permission",
      "O Google informou uma restrição do projeto ou da região para usar o Gemini. Confira a disponibilidade e os requisitos do projeto no Google AI Studio.",
    );
  if (value.statusCode === 400)
    return fail(
      "connection",
      "O Google recusou o formato ou a configuração da chamada ao Gemini (HTTP 400). Confira GEMINI_MODEL e tente novamente.",
    );
  if (value.statusCode === 429 || value.statusCode === 402)
    return fail(
      "quota",
      "O Google informou limite de uso ou cota indisponível para o Gemini. Aguarde e confira a cota do projeto no Google AI Studio.",
    );
  if (
    value.name === "TimeoutError" ||
    value.name === "AbortError" ||
    value.statusCode === 408 ||
    value.statusCode === 504
  )
    return fail("timeout", "O Gemini demorou para responder. Tente novamente em instantes.");
  if (value.statusCode && value.statusCode >= 500)
    return fail(
      "unavailable",
      "O Gemini está temporariamente indisponível. Tente novamente em instantes.",
    );
  return fail(
    "connection",
    "Não foi possível concluir a conexão com o Gemini. Confira a configuração da chave e do modelo no Worker; se persistir, consulte os logs do Cloudflare.",
  );
}

export function jujuResponse(result: JujuChatResult): string {
  if (!result.ok) throw new Error(result.message);
  return result.text;
}
