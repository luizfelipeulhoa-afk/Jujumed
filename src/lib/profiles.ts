import type { RespostaRegistrada } from "./tutor";
import type { ConceitoEQ, NotasCadernos } from "./exame2027";
import type { RevisaoErro } from "./caderno";

export interface Perfil {
  id: string;
  nome: string;
  avatar: string;
  cor: string;
  criadoEm: string;
  conceitoEQ?: ConceitoEQ;
}

import type { CadernoEntry } from "./caderno";

export interface DadosPerfil {
  sessao: {
    fila: string[];
    respostas: Record<string, RespostaRegistrada>;
    elapsed: number;
    nome: string;
    provaId: string;
  };
  caderno: CadernoEntry[];
  notasCadernos?: NotasCadernos;
  revisoes?: RevisaoErro[];
}

const PERFIS_KEY = "tutor-uerj-perfis";
const DADOS_PERFIL_KEY = "tutor-uerj-dados-perfil";

export const PERFIS_PADRAO: Perfil[] = [
  {
    id: "jujuba",
    nome: "Jujuba",
    avatar: "🌸",
    cor: "#e03a48",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "amigas",
    nome: "Amigas da Jujuba",
    avatar: "👯",
    cor: "#5b8def",
    criadoEm: new Date().toISOString(),
  },
];

export function carregarPerfis(): Perfil[] {
  if (typeof window === "undefined") return PERFIS_PADRAO;
  try {
    const raw = localStorage.getItem(PERFIS_KEY);
    if (raw) {
      const perfis = JSON.parse(raw) as Perfil[];
      if (Array.isArray(perfis) && perfis.length > 0) return perfis;
    }
  } catch {
    /* perfis corrompidos */
  }
  localStorage.setItem(PERFIS_KEY, JSON.stringify(PERFIS_PADRAO));
  return PERFIS_PADRAO;
}

export function salvarPerfis(perfis: Perfil[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERFIS_KEY, JSON.stringify(perfis));
}

export function carregarDadosPerfil(perfilId: string): DadosPerfil | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${DADOS_PERFIL_KEY}-${perfilId}`);
    if (raw) {
      return JSON.parse(raw) as DadosPerfil;
    }
  } catch {
    /* dados corrompidos */
  }
  return null;
}

export function salvarDadosPerfil(perfilId: string, dados: DadosPerfil): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${DADOS_PERFIL_KEY}-${perfilId}`, JSON.stringify(dados));
  } catch {
    /* erro ao salvar */
  }
}

export function limparDadosPerfil(perfilId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${DADOS_PERFIL_KEY}-${perfilId}`);
  } catch {
    /* erro ao limpar */
  }
}
