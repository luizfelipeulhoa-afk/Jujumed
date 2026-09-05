import { AREAS, QUESTIONS, type AreaId } from "../data/questions";

export interface ArquivoRecebido {
  nome: string;
  tipo: string;
  tamanho: number;
}

export interface DificuldadeDetectada {
  area: AreaId;
  termos: string[];
  dicaDeOuro: string;
  questoesSugeridas: string[];
}

export interface CadernoEntry {
  id: string;
  criadaEm: string; // ISO
  arquivos: ArquivoRecebido[];
  anotacoes: string;
  dificuldades: DificuldadeDetectada[];
}

const CADERNO_KEY = "tutor-uerj-caderno-v1";

export function carregarCaderno(): CadernoEntry[] {
  try {
    const raw = localStorage.getItem(CADERNO_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as CadernoEntry[];
      if (Array.isArray(arr)) return arr;
    }
  } catch {
    /* caderno corrompido → recomeça */
  }
  return [];
}

export function salvarCaderno(entries: CadernoEntry[]) {
  try {
    localStorage.setItem(CADERNO_KEY, JSON.stringify(entries));
  } catch {
    /* armazenamento indisponível */
  }
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Vocabulário típico de quem descreve onde a prova "doeu". */
const DICIONARIO: Record<AreaId, string[]> = {
  literatura: [
    "cortiço", "cortico", "aluísio", "aluisio", "azevedo", "naturalismo", "naturalista",
    "romance", "literatura", "bertoleza", "joão romão", "joao romao", "zoomorfização",
    "zoomorfizacao", "determinismo", "livro", "leitura",
  ],
  biologia: [
    "biologia", "ecologia", "teia alimentar", "cadeia alimentar", "magnificação", "magnificacao",
    "genética", "genetica", "homeostase", "glicose", "insulina", "glucagon", "célula", "celula",
    "respiração celular", "fermentação", "fermentacao", "mitocôndria", "mitocondria",
  ],
  quimica: [
    "química", "quimica", "equilíbrio", "equilibrio", "le chatelier", "chatelier",
    "orgânica", "organica", "funções orgânicas", "funcoes organicas", "éster", "ester",
    "amida", "ácido carboxílico", "hess", "termoquímica", "termoquimica", "entalpia",
  ],
  fisicamat: [
    "física", "fisica", "circuito", "potência", "potencia", "watt", "kwh", "eletrodinâmica",
    "eletrodinamica", "consumo de energia", "matemática", "matematica", "probabilidade",
    "conjunto", "porcentagem", "geometria", "cálculo", "calculo", "conta",
  ],
  humanas: [
    "história", "historia", "geografia", "vargas", "era vargas", "cidadania", "segregação",
    "segregacao", "urbanização", "urbanizacao", "rio de janeiro", "sociologia", "humanas",
  ],
};

/** Lê as anotações da aluna e devolve as áreas fracas detectadas, com dica e questões sugeridas. */
export function detectarDificuldades(anotacoes: string): DificuldadeDetectada[] {
  const texto = normalizar(anotacoes);
  const achadas: DificuldadeDetectada[] = [];
  (Object.keys(DICIONARIO) as AreaId[]).forEach((area) => {
    const termos = DICIONARIO[area].filter((palavra) => texto.includes(normalizar(palavra)));
    if (termos.length > 0) {
      const daArea = QUESTIONS.filter((q) => q.area === area);
      achadas.push({
        area,
        termos: termos.slice(0, 4),
        dicaDeOuro: daArea[0]?.dicaDeOuro ?? "",
        questoesSugeridas: daArea.slice(0, 2).map((q) => q.id),
      });
    }
  });
  return achadas;
}

/** Fila do "Simulado por Upload": questões sugeridas a partir das dificuldades enviadas. */
export function sugeridasDoCaderno(entries: CadernoEntry[]): string[] {
  const ids: string[] = [];
  entries.forEach((e) =>
    e.dificuldades.forEach((d) =>
      d.questoesSugeridas.forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      }),
    ),
  );
  return ids;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const PASSOS_PROCESSAMENTO = [
  "Lendo os arquivos enviados…",
  "Analisando suas anotações…",
  "Identificando áreas de dificuldade…",
  "Montando cartões de revisão com Dicas de Ouro…",
];

export { AREAS };
