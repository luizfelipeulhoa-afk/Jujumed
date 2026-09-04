import { QUESTIONS, type Question } from "../data/questions";

/** Espelho client-side dos endpoints do app.py (FastAPI). */

export const META_ACERTOS = 43; // ≥ 70% dos 60 itens do 2º EQ → Conceito A (+20 pts na 2ª fase)
export const TOTAL_ITENS_PROVA = 60;
export const ERROS_TOLERADOS = 17; // 60 − 43

export type Letra = "A" | "B" | "C" | "D";

export interface RespostaRegistrada {
  question_id: string;
  selected_option: Letra;
  is_correct: boolean;
  mensagem_tutor: string;
  explicacao_didatica: string;
  por_que_escolhida_errada: string | null;
  dica_de_ouro_uerj: string;
}

export interface EstatisticasAluna {
  total_respondidas: number;
  acertos: number;
  erros: number;
  taxa_aproveitamento: number; // %
  projecao_conceito: "A" | "B" | "C" | "D";
  margem_erros_restantes: number;
  faltam_acertos_meta: number;
}

export interface ResultadoCheck {
  is_correct: boolean;
  mensagem_tutor: string;
  explicacao_didatica: string;
  por_que_escolhida_errada: string | null;
  dica_de_ouro_uerj: string;
  estatisticas_aluna: EstatisticasAluna;
}

const ELOGIOS = [
  "Isso! Mandou bem — esse raciocínio é exatamente o que a banca espera de quem vai vestir o jaleco.",
  "Acertou! E, melhor: acertou entendendo o porquê. É assim que se constrói um Conceito A.",
  "Excelente! A UERJ adora esse tipo de questão — e ela acabou de virar ponto garantido seu.",
  "Na mosca! Cada acerto assim te aproxima dos 20 pontos de bonificação na 2ª fase.",
  "Muito bom! Você leu a questão como a banca escreve — esse é o diferencial de quem passa em Medicina.",
];

const ACOLHIMENTOS = [
  "Calma — errar aqui, agora, é o melhor lugar para errar. Cada deslize no treino vira um acerto no dia da prova.",
  "Sem neura: essa é exatamente o tipo de pegadinha que a banca monta. Agora que você viu por dentro, ela não te pega mais.",
  "Respira. Medicina é feita de persistência — e essa questão acabou de entrar no seu radar de revisão.",
  "Tudo bem! Errar no treino é diagnóstico, não sentença. Vamos entender juntas o que aconteceu?",
  "Olha pelo lado bom: você acabou de eliminar uma alternativa que não te engana duas vezes.",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seedFrom(id: string, letra: Letra): number {
  let h = 0;
  const s = id + letra;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function projetaConceito(taxa: number): "A" | "B" | "C" | "D" {
  if (taxa >= 70) return "A";
  if (taxa >= 60) return "B";
  if (taxa >= 50) return "C";
  return "D";
}

export function calculaEstatisticas(respostas: Map<string, RespostaRegistrada>): EstatisticasAluna {
  const total = respostas.size;
  const acertos = [...respostas.values()].filter((r) => r.is_correct).length;
  const erros = total - acertos;
  const taxa = total === 0 ? 0 : Math.round((acertos / total) * 1000) / 10;
  return {
    total_respondidas: total,
    acertos,
    erros,
    taxa_aproveitamento: taxa,
    projecao_conceito: projetaConceito(taxa),
    margem_erros_restantes: Math.max(0, ERROS_TOLERADOS - erros),
    faltam_acertos_meta: Math.max(0, META_ACERTOS - acertos),
  };
}

/** GET /api/next-question — primeira questão da fila ainda não respondida */
export function proximaQuestao(
  fila: string[],
  respostas: Map<string, RespostaRegistrada>,
): Question | null {
  for (const id of fila) {
    if (!respostas.has(id)) {
      return QUESTIONS.find((q) => q.id === id) ?? null;
    }
  }
  return null;
}

/** POST /api/check-answer */
export function corrigeResposta(
  question_id: string,
  selected_option: Letra,
  respostas: Map<string, RespostaRegistrada>,
): ResultadoCheck | null {
  const q = QUESTIONS.find((x) => x.id === question_id);
  if (!q) return null;

  const is_correct = selected_option === q.gabarito;
  const seed = seedFrom(question_id, selected_option);
  const mensagem_tutor = is_correct ? pick(ELOGIOS, seed) : pick(ACOLHIMENTOS, seed);
  const porQueErrada = is_correct ? null : q.porQueErrada[selected_option] ?? null;

  const registro: RespostaRegistrada = {
    question_id,
    selected_option,
    is_correct,
    mensagem_tutor,
    explicacao_didatica: q.explicacaoCorreta,
    por_que_escolhida_errada: porQueErrada,
    dica_de_ouro_uerj: q.dicaDeOuro,
  };

  const novas = new Map(respostas);
  novas.set(question_id, registro);
  const estatisticas_aluna = calculaEstatisticas(novas);

  return {
    is_correct,
    mensagem_tutor,
    explicacao_didatica: q.explicacaoCorreta,
    por_que_escolhida_errada: porQueErrada,
    dica_de_ouro_uerj: q.dicaDeOuro,
    estatisticas_aluna,
  };
}

export function formatTempo(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export { QUESTIONS };
