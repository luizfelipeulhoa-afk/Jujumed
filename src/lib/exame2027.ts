import type { Disciplina2027 } from "../data/exame2027";

export type ConceitoEQ = "A" | "B" | "C" | "D" | null;
export const BONUS_EQ: Record<Exclude<ConceitoEQ, null>, number> = { A: 20, B: 15, C: 10, D: 5 };

export interface NotasCadernos {
  biologia: number | null;
  quimica: number | null;
  redacao: number | null;
}

export function bonusDoConceito(conceito: ConceitoEQ): number {
  return conceito ? BONUS_EQ[conceito] : 0;
}

export function calcularNotaFinal(conceito: ConceitoEQ, notas: NotasCadernos): number | null {
  if (!conceito || notas.biologia === null || notas.quimica === null || notas.redacao === null) return null;
  return Math.min(100, bonusDoConceito(conceito) + notas.biologia * 2 + notas.quimica + notas.redacao);
}

export function rotuloDisciplina(disciplina: Disciplina2027): string {
  return disciplina === "biologia" ? "Biologia" : disciplina === "quimica" ? "Química" : "Redação";
}

export const DATA_EXAME_2027 = new Date("2026-11-29T09:00:00-03:00");