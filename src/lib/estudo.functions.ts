import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  FOCOS_ESTUDO,
  MIN_TEXTO_ESTUDO,
  traduzirFalhaGemini,
  type ResultadoQuiz,
  type ResultadoResumo,
} from "./estudo";
import { geminiFailure } from "./gemini-connection";

const focoSchema = z.enum(FOCOS_ESTUDO);

const resumoSchema = z.object({
  texto: z.string().trim().min(MIN_TEXTO_ESTUDO).max(20_000),
  foco: focoSchema,
});

const quizSchema = z.object({
  texto: z.string().trim().min(MIN_TEXTO_ESTUDO).max(20_000),
  foco: focoSchema,
  quantidade: z.union([z.literal(3), z.literal(5)]).default(5),
});

export const resumirConteudo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resumoSchema.parse(input))
  .handler(async ({ data }): Promise<ResultadoResumo> => {
    try {
      const { resumirTexto } = await import("./estudo-resumo.server");
      const resultado = await resumirTexto(data.texto, data.foco);
      if (!resultado.resumo.trim()) {
        return {
          ok: false,
          code: "empty",
          message: "O Gemini não devolveu um resumo. Tente um trecho um pouco menor.",
        };
      }
      return { ok: true, resumo: resultado.resumo, recortado: resultado.recortado };
    } catch (error) {
      const failure = geminiFailure(error);
      const falha = traduzirFalhaGemini(failure.code, failure.message);
      console.error("[resumo]", falha.code);
      return falha;
    }
  });

export const gerarQuiz = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => quizSchema.parse(input))
  .handler(async ({ data }): Promise<ResultadoQuiz> => {
    try {
      const { gerarQuizGroq } = await import("./groq.server");
      const resultado = await gerarQuizGroq(data);
      return { ok: true, quiz: resultado.quiz, recortado: resultado.recortado };
    } catch (error) {
      const { classificarGroq } = await import("./groq.server");
      const falha = classificarGroq(error);
      console.error("[quiz]", falha.code);
      return falha;
    }
  });
