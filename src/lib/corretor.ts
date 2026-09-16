import type { QuestaoDiscursiva } from "../data/discursivas";

export interface ResultadoCorrecao {
  nota: number; // 0.0 a 1.0
  notaPercentual: number; // 0 a 100
  conceito: "A" | "B" | "C" | "D" | "E";
  criteriosAvaliados: {
    descricao: string;
    peso: number;
    atingido: boolean;
    pontuacao: number;
    palavrasEncontradas: string[];
    palavrasFaltantes: string[];
  }[];
  palavrasEssenciaisEncontradas: string[];
  palavrasEssenciaisFaltantes: string[];
  palavrasDesejaveisEncontradas: string[];
  armadilhasDetectadas: { erro: string; correcao: string }[];
  feedback: string;
  pontosFortes: string[];
  pontosAMelhorar: string[];
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairPalavras(texto: string): string[] {
  return normalizar(texto).split(" ").filter((p) => p.length > 2);
}

function contemPalavra(texto: string, palavra: string): boolean {
  const textoNorm = normalizar(texto);
  const palavraNorm = normalizar(palavra);
  return textoNorm.includes(palavraNorm);
}

function contemQualquerPalavra(texto: string, palavras: string[]): string[] {
  return palavras.filter((p) => contemPalavra(texto, p));
}

export function corrigirResposta(
  questao: QuestaoDiscursiva,
  respostaAluna: string,
): ResultadoCorrecao {
  const palavrasAluna = extrairPalavras(respostaAluna);
  const textoAluna = normalizar(respostaAluna);

  // 1. Avaliar critérios
  const criteriosAvaliados = questao.criterios.map((criterio) => {
    const palavrasEncontradas = contemQualquerPalavra(textoAluna, criterio.palavrasChave);
    const palavrasFaltantes = criterio.palavrasChave.filter(
      (p) => !palavrasEncontradas.includes(p),
    );

    // Critério atingido se encontrou pelo menos 50% das palavras-chave
    const taxaCobertura = palavrasEncontradas.length / criterio.palavrasChave.length;
    const atingido = taxaCobertura >= 0.5;
    const pontuacao = atingido ? criterio.peso : criterio.peso * taxaCobertura;

    return {
      descricao: criterio.descricao,
      peso: criterio.peso,
      atingido,
      pontuacao,
      palavrasEncontradas,
      palavrasFaltantes,
    };
  });

  const notaCriterios = criteriosAvaliados.reduce((sum, c) => sum + c.pontuacao, 0);

  // 2. Avaliar palavras essenciais (obrigatórias)
  const palavrasEssenciaisEncontradas = contemQualquerPalavra(
    textoAluna,
    questao.palavrasEssenciais,
  );
  const palavrasEssenciaisFaltantes = questao.palavrasEssenciais.filter(
    (p) => !palavrasEssenciaisEncontradas.includes(p),
  );
  const taxaEssenciais =
    palavrasEssenciaisEncontradas.length / questao.palavrasEssenciais.length;
  const notaEssenciais = taxaEssenciais * 0.2; // 20% do peso

  // 3. Avaliar palavras desejáveis (bônus)
  const palavrasDesejaveisEncontradas = contemQualquerPalavra(
    textoAluna,
    questao.palavrasDesejaveis,
  );
  const taxaDesejaveis =
    palavrasDesejaveisEncontradas.length / questao.palavrasDesejaveis.length;
  const notaDesejaveis = taxaDesejaveis * 0.1; // 10% do peso

  // 4. Detectar armadilhas (penalidades)
  const armadilhasDetectadas = questao.armadilhas.filter((armadilha) =>
    contemPalavra(textoAluna, armadilha.erro),
  );
  const penalidadeArmadilhas = armadilhasDetectadas.length * 0.1; // -0.1 cada

  // 5. Calcular nota final
  const notaBruta = notaCriterios * 0.7 + notaEssenciais + notaDesejaveis - penalidadeArmadilhas;
  const nota = Math.max(0, Math.min(1, notaBruta));
  const notaPercentual = Math.round(nota * 100);

  // 6. Determinar conceito
  let conceito: "A" | "B" | "C" | "D" | "E";
  if (notaPercentual >= 90) conceito = "A";
  else if (notaPercentual >= 75) conceito = "B";
  else if (notaPercentual >= 60) conceito = "C";
  else if (notaPercentual >= 40) conceito = "D";
  else conceito = "E";

  // 7. Gerar feedback
  const pontosFortes: string[] = [];
  const pontosAMelhorar: string[] = [];

  criteriosAvaliados.forEach((c) => {
    if (c.atingido) {
      pontosFortes.push(`✓ ${c.descricao}`);
    } else {
      pontosAMelhorar.push(`✗ ${c.descricao}`);
    }
  });

  if (palavrasEssenciaisFaltantes.length > 0) {
    pontosAMelhorar.push(
      `✗ Faltaram conceitos essenciais: ${palavrasEssenciaisFaltantes.join(", ")}`,
    );
  }

  if (palavrasDesejaveisEncontradas.length > 0) {
    pontosFortes.push(
      `✓ Usou termos técnicos avançados: ${palavrasDesejaveisEncontradas.slice(0, 3).join(", ")}`,
    );
  }

  armadilhasDetectadas.forEach((a) => {
    pontosAMelhorar.push(`⚠ Erro comum: ${a.erro} → ${a.correcao}`);
  });

  let feedback = "";
  if (conceito === "A") {
    feedback =
      "Excelente! Sua resposta está completa e bem estruturada. Você demonstrou domínio do conteúdo e usou a terminologia correta.";
  } else if (conceito === "B") {
    feedback =
      "Muito bom! Sua resposta está quase completa. Faltam alguns detalhes para atingir a nota máxima.";
  } else if (conceito === "C") {
    feedback =
      "Resposta parcial. Você abordou alguns pontos importantes, mas deixou de lado aspectos fundamentais da questão.";
  } else if (conceito === "D") {
    feedback =
      "Resposta insuficiente. Você mencionou alguns conceitos, mas a explicação está incompleta ou imprecisa.";
  } else {
    feedback =
      "Resposta muito incompleta. É necessário revisar o conteúdo e praticar mais questões discursivas.";
  }

  return {
    nota,
    notaPercentual,
    conceito,
    criteriosAvaliados,
    palavrasEssenciaisEncontradas,
    palavrasEssenciaisFaltantes,
    palavrasDesejaveisEncontradas,
    armadilhasDetectadas,
    feedback,
    pontosFortes,
    pontosAMelhorar,
  };
}
