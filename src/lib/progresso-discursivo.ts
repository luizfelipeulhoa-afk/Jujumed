import type { ResultadoCorrecao } from "./corretor";

export interface ProgressoDiscursivo {
  indiceAtual: number;
  respostas: Record<string, string>;
  resultados: Record<string, ResultadoCorrecao>;
}

const CHAVE_BASE = "tutor-uerj-progresso-discursivo";

function progressoVazio(): ProgressoDiscursivo {
  return { indiceAtual: 0, respostas: {}, resultados: {} };
}

export function carregarProgressoDiscursivo(
  perfilId: string,
  totalQuestoes: number,
): ProgressoDiscursivo {
  try {
    const raw = localStorage.getItem(`${CHAVE_BASE}-${perfilId}`);
    if (!raw) return progressoVazio();

    const dados: unknown = JSON.parse(raw);
    if (!dados || typeof dados !== "object") return progressoVazio();

    const progresso = dados as Partial<ProgressoDiscursivo>;
    const respostas = progresso.respostas;
    const resultados = progresso.resultados;
    if (
      !respostas || typeof respostas !== "object" ||
      !resultados || typeof resultados !== "object"
    ) return progressoVazio();

    const respostasValidas = Object.fromEntries(
      Object.entries(respostas).filter(([, resposta]) => typeof resposta === "string"),
    );
    const resultadosValidos = Object.fromEntries(
      Object.entries(resultados).filter(([, resultado]) =>
        resultado && typeof resultado === "object" &&
        typeof resultado.nota === "number" &&
        typeof resultado.notaPercentual === "number" &&
        typeof resultado.conceito === "string",
      ),
    ) as Record<string, ResultadoCorrecao>;

    const indiceAtual = Number.isInteger(progresso.indiceAtual)
      ? Math.max(0, Math.min(totalQuestoes - 1, progresso.indiceAtual!))
      : 0;

    return { indiceAtual, respostas: respostasValidas, resultados: resultadosValidos };
  } catch {
    return progressoVazio();
  }
}

export function salvarProgressoDiscursivo(
  perfilId: string,
  progresso: ProgressoDiscursivo,
): void {
  try {
    localStorage.setItem(`${CHAVE_BASE}-${perfilId}`, JSON.stringify(progresso));
  } catch {
    // O simulado continua disponível mesmo quando o navegador bloqueia o armazenamento.
  }
}
