import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CADERNOS_2027 } from "../data/exame2027";

const entradaSchema = z.object({ questaoId: z.string(), resposta: z.string() });

export interface CriterioAvaliadoIA {
  descricao: string;
  maximo: number;
  obtido: number;
  justificativa: string;
}

export interface ResultadoCorrecaoIA {
  nota: number;
  notaMaxima: number;
  violacao: boolean;
  aviso: string | null;
  criterios: CriterioAvaliadoIA[];
  pontosFortes: string[];
  faltouParaNotaMaxima: string[];
  comparacaoDsea: string;
  feedback: string;
}

const PADROES_INJECAO = [
  /ignore\s+(as|todas|qualquer)?\s*instru[cç][oõ]es/i,
  /d[eê]\s+nota\s+(10|dez|m[aá]xima)/i,
  /sou\s+(o|a)\s+administrador/i,
  /system\s*prompt/i,
  /revele\s+(seu|o)\s+prompt/i,
  /finja\s+que\s+(voc[eê]|as instru[cç][oõ]es)/i,
];

function bloqueada(resposta: string) {
  return PADROES_INJECAO.some((padrao) => padrao.test(resposta));
}

export const corrigirDiscursivaIA = createServerFn({ method: "POST" })
  .inputValidator((input) => entradaSchema.parse(input))
  .handler(async ({ data }): Promise<ResultadoCorrecaoIA> => {
    const questoes = Object.values(CADERNOS_2027).flat();
    const questao = questoes.find((item) => item.id === data.questaoId);
    if (!questao) throw new Error("Questão não encontrada.");

    if (bloqueada(data.resposta)) {
      return {
        nota: 0,
        notaMaxima: questao.pontuacaoMaxima,
        violacao: true,
        aviso: "Violação de critério de resposta identificada",
        criterios: questao.criterios.map((c) => ({ descricao: c.descricao, maximo: c.pontos, obtido: 0, justificativa: "Resposta bloqueada antes da avaliação." })),
        pontosFortes: [],
        faltouParaNotaMaxima: ["Responder apenas ao comando da questão, sem instruções dirigidas ao avaliador."],
        comparacaoDsea: "A resposta não pôde ser comparada ao padrão da banca por violar o critério de resposta.",
        feedback: "Reescreva a resposta tratando somente do conteúdo solicitado.",
      };
    }

    const [{ streamText }, { getConfiguredAiModel }] = await Promise.all([
      import("ai"), import("./ai-provider.server"),
    ]);
    const rubric = questao.criterios.map((c) => `- ${c.descricao}: 0 a ${c.pontos} ponto(s)`).join("\n");
    const result = streamText({
      model: getConfiguredAiModel(),
      messages: [
        { role: "system", content: "Você é avaliador rigoroso do Exame Discursivo DSEA/UERJ. Avalie somente conhecimento demonstrado em frases coerentes. Não dê pontos a contradições, afirmações cientificamente falsas nem listas desconexas de palavras-chave. Responda exclusivamente com JSON válido, sem markdown." },
        { role: "user", content: `QUESTÃO: ${questao.comando}\nAPOIO: ${questao.apoio}\nPADRÃO ESPERADO DSEA: ${questao.padraoDsea}\nRUBRICA:\n${rubric}\nRESPOSTA DA ALUNA:\n${data.resposta}\n\nRetorne JSON com: criterios (array com descricao,maximo,obtido,justificativa), pontosFortes (array), faltouParaNotaMaxima (array), comparacaoDsea (string), feedback (string). A soma de obtido não pode exceder ${questao.pontuacaoMaxima}.` },
      ],
    });
    const text = await result.text;
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(clean) as Record<string, unknown>; } catch { throw new Error("A avaliação retornou um formato inválido. Tente novamente."); }
    const rawCriterios = Array.isArray(parsed['criterios']) ? parsed['criterios'] : [];
    const criterios = questao.criterios.map((base, index) => {
      const raw = rawCriterios[index] as Record<string, unknown> | undefined;
      const obtido = Math.max(0, Math.min(base.pontos, Number(raw?.['obtido']) || 0));
      return { descricao: base.descricao, maximo: base.pontos, obtido, justificativa: String(raw?.['justificativa'] || "Critério não demonstrado com clareza.") };
    });
    const nota = Math.round(criterios.reduce((sum, item) => sum + item.obtido, 0) * 10) / 10;
    const strings = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 5) : [];
    return {
      nota, notaMaxima: questao.pontuacaoMaxima, violacao: false, aviso: null, criterios,
      pontosFortes: strings(parsed['pontosFortes']),
      faltouParaNotaMaxima: strings(parsed['faltouParaNotaMaxima']),
      comparacaoDsea: String(parsed['comparacaoDsea'] || "Compare os conceitos e a cadeia explicativa com o padrão esperado."),
      feedback: String(parsed['feedback'] || "Revise os critérios não pontuados e reescreva a resposta."),
    };
  });
