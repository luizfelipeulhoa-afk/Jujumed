import type { Disciplina2027 } from "../data/exame2027";

export type ConceitoEQ = "A" | "B" | "C" | "D" | null;
export const BONUS_EQ: Record<Exclude<ConceitoEQ, null>, number> = { A: 20, B: 15, C: 10, D: 5 };

export const PONTOS_POR_QUESTAO = 2.0;
export const PESO_DISCIPLINA: Record<Disciplina2027, number> = {
  biologia: 2,
  quimica: 1,
  redacao: 1,
};

export interface NotasCadernos {
  biologia: number | null; // 0 a 20 (antes do peso 2)
  quimica: number | null;  // 0 a 20 (peso 1)
  redacao: number | null;  // 0 a 20 (peso 1)
}

export type NotasPorSemana = Record<string, NotasCadernos>;

export function bonusDoConceito(conceito: ConceitoEQ): number {
  return conceito ? BONUS_EQ[conceito] : 0;
}

/**
 * Calcula a nota ponderada das provas discursivas (0 a 80 pontos):
 * Biologia (0–20) × Peso 2 (0–40) + Química (0–20) × Peso 1 + Redação (0–20) × Peso 1
 */
export function calcularSomaDiscursivas(notas: NotasCadernos): number {
  const bio = (notas.biologia ?? 0) * PESO_DISCIPLINA.biologia;
  const qui = (notas.quimica ?? 0) * PESO_DISCIPLINA.quimica;
  const red = (notas.redacao ?? 0) * PESO_DISCIPLINA.redacao;
  return Math.min(80, Math.round((bio + qui + red) * 10) / 10);
}

export function temAlgumaNota(notas: NotasCadernos): boolean {
  return notas.biologia !== null || notas.quimica !== null || notas.redacao !== null;
}

/**
 * Calcula a nota final UERJ (0 a 100 pontos):
 * Bônus EQ (até 20) + Biologia × 2 (até 40) + Química (até 20) + Redação (até 20)
 */
export function calcularNotaFinal(conceito: ConceitoEQ, notas: NotasCadernos): number | null {
  if (!conceito && !temAlgumaNota(notas)) return null;
  const somaDiscursiva = calcularSomaDiscursivas(notas);
  return Math.min(100, Math.round((bonusDoConceito(conceito) + somaDiscursiva) * 10) / 10);
}

export function rotuloDisciplina(disciplina: Disciplina2027): string {
  return disciplina === "biologia" ? "Biologia" : disciplina === "quimica" ? "Química" : "Redação";
}

export const DATA_EXAME_2027 = new Date("2026-11-29T09:00:00-03:00");