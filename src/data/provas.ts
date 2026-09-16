import { QUESTIONS } from "./questions";

export interface ProvaDef {
  id: string;
  nome: string;
  subtitulo: string;
  info: string;
  fila: string[];
}

export function rotuloProva(prova: ProvaDef): string {
  return prova.subtitulo ? `${prova.nome} (${prova.subtitulo})` : prova.nome;
}

/** Prova de Domingo — 2º EQ com "O Cortiço" (literatura obrigatória inclusa). */
export const PROVA_DOMINGO: ProvaDef = {
  id: "domingo",
  nome: "UERJ 2026 · 2º EQ",
  subtitulo: "O Cortiço",
  info: `${QUESTIONS.length} questões contextualizadas · literatura obrigatória inclusa · 5 áreas`,
  fila: QUESTIONS.map((q) => q.id),
};

/** 1º EQ — rodada geral, sem literatura obrigatória (cobrada apenas no 2º EQ). */
export const PROVA_PRIMEIRO_EQ: ProvaDef = {
  id: "primeiro-eq",
  nome: "UERJ 2026 · 1º EQ",
  subtitulo: "Rodada geral",
  info: `${QUESTIONS.filter((q) => q.area !== "literatura").length} questões · sem literatura obrigatória · Ciências, Humanas e Linguagens`,
  fila: QUESTIONS.filter((q) => q.area !== "literatura").map((q) => q.id),
};
