export type DisciplinaDiscursiva = "biologia" | "quimica";

/**
 * Questão discursiva no padrão UERJ 3ª fase (Exame Discursivo de Medicina).
 *
 * Cada questão tem:
 * - enunciado + apoio (contexto realista)
 * - comando (o que a aluna deve responder)
 * - gabarito esperado (modelo de resposta ideal)
 * - critérios de correção com pesos
 * - palavras-chave essenciais (obrigatórias) e desejáveis (bônus)
 * - armadilhas comuns (o que a banca espera que a aluna NÃO escreva)
 */
export interface QuestaoDiscursiva {
  id: string;
  disciplina: DisciplinaDiscursiva;
  tema: string;
  subtema: string;
  apoio?: { texto: string; fonte: string };
  comando: string;
  /** Modelo de resposta ideal (padrão UERJ). */
  gabarito: string;
  /** Critérios de correção com peso (soma = 1.0). */
  criterios: { descricao: string; peso: number; palavrasChave: string[] }[];
  /** Palavras-chave OBRIGATÓRIAS para pontuar. */
  palavrasEssenciais: string[];
  /** Palavras-chave DESEJÁVEIS (bônus). */
  palavrasDesejaveis: string[];
  /** Conceitos errados que a banca penaliza. */
  armadilhas: { erro: string; correcao: string }[];
  /** Dica de ouro estilo UERJ. */
  dicaDeOuro: string;
  /** Pontuação máxima da questão (padrão UERJ: 1.0 por questão). */
  pontuacaoMaxima: number;
}

export const QUESTOES_DISCURSIVAS: QuestaoDiscursiva[] = [
  // ================= BIOLOGIA =================
  {
    id: "disc-bio-01",
    disciplina: "biologia",
    tema: "Fisiologia humana",
    subtema: "Homeostase glicêmica e diabetes",
    apoio: {
      texto:
        "Uma paciente de 45 anos chega ao pronto-socorro com poliúria (urina em grande volume), polidipsia (sede intensa) e perda de peso inexplicada. Exames revelam glicemia de jejum de 210 mg/dL (normal < 100 mg/dL) e presença de corpos cetônicos na urina. O médico diagnostica diabetes mellitus descompensado.",
      fonte: "Adaptado de caso clínico no padrão UERJ 3ª fase.",
    },
    comando:
      "Explique os mecanismos fisiológicos que relacionam a deficiência de insulina aos três sintomas descritos (poliúria, polidipsia e perda de peso) e justifique a presença de corpos cetônicos na urina.",
    gabarito:
      "A deficiência de insulina impede a captação de glicose pelas células, causando hiperglicemia. Quando a glicemia ultrapassa o limiar renal (~180 mg/dL), ocorre glicosúria — a glicose não reabsorvida no túbulo renal arrasta água por osmose, causando poliúria. A perda hídrica excessiva estimula osmorreceptores no hipotálamo, gerando polidipsia. Sem glicose intracelular, o organismo recorre ao catabolismo de lipídios e proteínas para obter energia, explicando a perda de peso. A β-oxidação acelerada de ácidos graxos no fígado produz corpos cetônicos (acetona, acetoacetato, β-hidroxibutirato) em excesso, causando cetoacidose e cetona urinária.",
    criterios: [
      {
        descricao: "Relacionar falta de insulina → hiperglicemia → glicosúria → poliúria (osmose)",
        peso: 0.3,
        palavrasChave: ["insulina", "glicose", "hiperglicemia", "glicosúria", "osmose", "poliúria", "rim", "renal"],
      },
      {
        descricao: "Explicar polidipsia via osmorreceptores hipotalâmicos e sede",
        peso: 0.2,
        palavrasChave: ["polidipsia", "sede", "hipotálamo", "osmorreceptor", "desidratação", "perda hídrica"],
      },
      {
        descricao: "Explicar perda de peso pelo catabolismo de lipídios e proteínas",
        peso: 0.2,
        palavrasChave: ["catabolismo", "lipídio", "proteína", "gordura", "energia", "perda peso", "gliconeogênese"],
      },
      {
        descricao: "Justificar corpos cetônicos pela β-oxidação e cetoacidose",
        peso: 0.3,
        palavrasChave: ["corpos cetônicos", "cetona", "β-oxidação", "ácido graxo", "fígado", "cetoacidose", "acetona"],
      },
    ],
    palavrasEssenciais: ["insulina", "glicose", "poliúria", "polidipsia", "corpos cetônicos"],
    palavrasDesejaveis: ["glicosúria", "osmose", "hipotálamo", "β-oxidação", "cetoacidose", "limiar renal"],
    armadilhas: [
      {
        erro: "dizer que a insulina aumenta a glicemia",
        correcao: "a insulina REDUZ a glicemia ao facilitar a entrada de glicose nas células",
      },
      {
        erro: "confundir diabetes mellitus com diabetes insipidus",
        correcao: "no mellitus há problema com insulina/glicose; no insipidus há problema com ADH",
      },
    ],
    dicaDeOuro:
      "UERJ ama cadeia causal: insulina↓ → glicose não entra na célula → hiperglicemia → glicosúria → poliúria osmótica → desidratação → polidipsia. Sempre escreva a cadeia completa, não só o efeito final.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-bio-02",
    disciplina: "biologia",
    tema: "Genética molecular",
    subtema: "Expressão gênica e mutações",
    apoio: {
      texto:
        "A anemia falciforme é causada por uma mutação pontual no gene da β-globina, que substitui ácido glutâmico por valina na posição 6 da cadeia proteica. Essa alteração modifica a conformação da hemoglobina (HbS), que polimeriza em baixa tensão de O₂, deformando as hemácias.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "A partir da informação de que a substituição do ácido glutâmico pela valina decorre da troca de um único nucleotídeo no DNA, explique: (a) como essa alteração no DNA se propaga até a proteína; (b) por que a mudança de um único aminoácido é suficiente para alterar a função da hemoglobina.",
    gabarito:
      "(a) A mutação pontual no DNA (troca de um par de bases, ex.: A→T no códon GAG→GTG) é transcrita em um mRNA com códon alterado (GAG→GUG). Durante a tradução nos ribossomos, esse códon modificado incorpora valina no lugar de ácido glutâmico na posição 6 da β-globina. (b) A estrutura tridimensional da proteína depende das interações entre os radicais dos aminoácidos. O ácido glutâmico é polar e carregado negativamente (hidrofílico), enquanto a valina é apolar e hidrofóbica. Essa troca altera a superfície da hemoglobina, criando uma região hidrofóbica que, em baixa tensão de O₂, interage com outras moléculas de HbS, causando polimerização e deformação das hemácias.",
    criterios: [
      {
        descricao: "Descrever o fluxo DNA → mRNA → proteína (transcrição e tradução)",
        peso: 0.4,
        palavrasChave: ["dna", "mrna", "transcrição", "tradução", "códon", "ribossomo", "nucleotídeo", "base"],
      },
      {
        descricao: "Explicar relação estrutura-função da proteína",
        peso: 0.3,
        palavrasChave: ["estrutura", "função", "conformação", "tridimensional", "aminoácido", "radical", "dobramento"],
      },
      {
        descricao: "Diferenciar polaridade dos aminoácidos (glutâmico polar × valina apolar)",
        peso: 0.3,
        palavrasChave: ["polar", "apolar", "hidrofílico", "hidrofóbico", "carga", "interação", "polimerização"],
      },
    ],
    palavrasEssenciais: ["dna", "mrna", "transcrição", "tradução", "aminoácido", "proteína"],
    palavrasDesejaveis: ["códon", "ribossomo", "polar", "apolar", "hidrofílico", "hidrofóbico", "polimerização"],
    armadilhas: [
      {
        erro: "dizer que a mutação altera diretamente a proteína sem passar pelo RNA",
        correcao: "o fluxo é DNA → RNA → proteína (dogma central da biologia molecular)",
      },
      {
        erro: "confundir mutação pontual com deleção ou inserção de bases",
        correcao: "mutação pontual troca UMA base; pode ser silenciosa, missense ou nonsense",
      },
    ],
    dicaDeOuro:
      "UERJ cobra o dogma central (DNA→RNA→proteína) em 90% das questões de genética molecular. Sempre cite transcrição E tradução, mesmo que o enunciado só pergunte sobre a proteína.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-bio-03",
    disciplina: "biologia",
    tema: "Ecologia",
    subtema: "Ciclos biogeoquímicos e impacto humano",
    apoio: {
      texto:
        "O uso intensivo de fertilizantes nitrogenados na agricultura e a queima de combustíveis fósseis alteraram significativamente o ciclo do nitrogênio. Em regiões de escoamento agrícola para lagos e represas, observa-se proliferação excessiva de algas (eutrofização) seguida de mortandade de peixes.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Descreva o caminho do nitrogênio dos fertilizantes até a eutrofização do corpo d'água e explique a cadeia de eventos que leva à mortandade de peixes, citando os processos biológicos envolvidos.",
    gabarito:
      "Os fertilizantes nitrogenados (nitratos, NO₃⁻) são lixiviados do solo para corpos d'água por escoamento superficial. O excesso de nutrientes (N e P) provoca floração algacial (eutrofização). As algas proliferam na superfície, bloqueando a luz solar para organismos fotossintetizantes submersos, que morrem. Bactérias aeróbicas decompositoras consomem o O₂ dissolvido na decomposição da matéria orgânica morta (demanda bioquímica de oxigênio elevada). A depleção do O₂ dissolvido (hipóxia ou anoxia) causa asfixia e mortandade de peixes e outros organismos aeróbicos aquáticos.",
    criterios: [
      {
        descricao: "Descrever lixiviação de nitratos do solo para a água",
        peso: 0.2,
        palavrasChave: ["fertilizante", "nitrato", "lixiviação", "escoamento", "solo", "água", "nutriente"],
      },
      {
        descricao: "Explicar eutrofização e floração algacial",
        peso: 0.25,
        palavrasChave: ["eutrofização", "alga", "floração", "proliferação", "nutriente", "fotossíntese"],
      },
      {
        descricao: "Explicar decomposição bacteriana e consumo de O₂",
        peso: 0.3,
        palavrasChave: ["decomposição", "bactéria", "oxigênio", "aeróbico", "matéria orgânica", "demanda bioquímica"],
      },
      {
        descricao: "Concluir com hipóxia/anoxia e mortandade",
        peso: 0.25,
        palavrasChave: ["hipóxia", "anoxia", "asfixia", "mortandade", "peixe", "depleção", "dissolvido"],
      },
    ],
    palavrasEssenciais: ["eutrofização", "alga", "decomposição", "oxigênio", "bactéria"],
    palavrasDesejaveis: ["nitrato", "lixiviação", "aeróbico", "hipóxia", "demanda bioquímica", "fotossintetizante"],
    armadilhas: [
      {
        erro: "dizer que as algas matam os peixes diretamente por toxinas",
        correcao: "a mortandade é por depleção de O₂ na decomposição, não por toxicidade direta (exceto em florações de cianobactérias específicas)",
      },
      {
        erro: "confundir eutrofização com poluição por metais pesados",
        correcao: "eutrofização é excesso de nutrientes (N, P); metais pesados causam bioacumulação/magnificação trófica",
      },
    ],
    dicaDeOuro:
      "Cadeia da eutrofização: nutriente↑ → alga↑ → luz↓ → planta submersa morre → bactéria decompõe → O₂↓ → peixe morre. A UERJ quer TODOS os elos dessa cadeia, não só o início e o fim.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-bio-04",
    disciplina: "biologia",
    tema: "Citologia",
    subtema: "Divisão celular e câncer",
    apoio: {
      texto:
        "A vinblastina é um fármaco quimioterápico que se liga à tubulina, impedindo a polimerização dos microtúbulos. Células tratadas com vinblastina iniciam a mitose, mas não conseguem completá-la, acumulando-se em uma fase específica do ciclo celular.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Identifique a fase do ciclo celular em que as células tratadas com vinblastina se acumulam e explique por que a interrupção da formação dos microtúbulos impede a conclusão da mitose.",
    gabarito:
      "As células se acumulam na metáfase (ou prometáfase). Os microtúbulos são componentes essenciais do fuso mitótico, estrutura responsável pela organização e movimentação dos cromossomos durante a divisão celular. Sem microtúbulos funcionais, o fuso não se forma adequadamente, impedindo: (1) a captura dos cinetocoros dos cromossomos pelas fibras do fuso; (2) o alinhamento dos cromossomos na placa equatorial (metáfase); (3) a migração das cromátides-irmãs para os polos na anáfase. O checkpoint do fuso (SAC) detecta a ausência de anexação bipolar e bloqueia a transição metáfase-anáfase, paralisando a célula.",
    criterios: [
      {
        descricao: "Identificar metáfase/prometáfase como fase de acúmulo",
        peso: 0.25,
        palavrasChave: ["metáfase", "prometáfase", "fase", "acúmulo", "parada", "bloqueio"],
      },
      {
        descricao: "Relacionar microtúbulos ao fuso mitótico",
        peso: 0.25,
        palavrasChave: ["microtúbulo", "fuso", "mitótico", "tubulina", "fibra", "estrutura"],
      },
      {
        descricao: "Explicar papel do fuso na movimentação dos cromossomos",
        peso: 0.3,
        palavrasChave: ["cromossomo", "cinetocoro", "placa equatorial", "anáfase", "migração", "polo", "cromátide"],
      },
      {
        descricao: "Mencionar checkpoint do fuso (SAC) como mecanismo de parada",
        peso: 0.2,
        palavrasChave: ["checkpoint", "sac", "controle", "anáfase", "transição", "bloqueio"],
      },
    ],
    palavrasEssenciais: ["metáfase", "microtúbulo", "fuso", "cromossomo"],
    palavrasDesejaveis: ["cinetocoro", "placa equatorial", "anáfase", "checkpoint", "sac", "tubulina"],
    armadilhas: [
      {
        erro: "dizer que a célula para na prófase",
        correcao: "a prófase ocorre ANTES da formação completa do fuso; a parada é na metáfase/prometáfase, quando o fuso já deveria estar capturando os cromossomos",
      },
      {
        erro: "confundir microtúbulos com microfilamentos de actina",
        correcao: "microtúbulos (tubulina) formam o fuso; microfilamentos (actina) participam do sulco de clivagem na citocinese",
      },
    ],
    dicaDeOuro:
      "Quimioterápicos que afetam o fuso (vinblastina, vincristina, taxol) sempre param a célula na METÁFASE. A UERJ adora essa relação fármaco-mecanismo-ciclo celular.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-bio-05",
    disciplina: "biologia",
    tema: "Imunologia",
    subtema: "Vacinas e resposta imune",
    apoio: {
      texto:
        "Uma criança recebe a primeira dose da vacina tríplice viral (sarampo, caxumba e rubéola) aos 12 meses de idade. O pediatra orienta que uma segunda dose (reforço) deve ser administrada aos 15 meses. Após a primeira dose, os níveis de anticorpos específicos sobem gradualmente; após o reforço, a resposta é muito mais rápida e intensa.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Explique a diferença entre a resposta imune primária e a secundária, relacionando-a ao esquema vacinal descrito. Cite os tipos de células envolvidas em cada resposta e justifique por que o reforço é necessário.",
    gabarito:
      "Na resposta primária (após a 1ª dose), linfócitos B virgens reconhecem o antígeno viral e, com auxílio de linfócitos T helper, proliferam e diferenciam-se em plasmócitos (produtores de anticorpos) e células B de memória. A produção de anticorpos é lenta (período de latência de 7-14 dias) e atinge pico modesto. Na resposta secundária (após o reforço), as células B de memória geradas na primeira exposição reconhecem rapidamente o mesmo antígeno, proliferam e diferenciam-se em plasmócitos que produzem anticorpos em maior quantidade, com maior afinidade (maturação por hipermutação somática) e por mais tempo. O reforço é necessário porque a resposta primária não gera imunidade duradoura em todos os indivíduos; o reforço eleva os títulos de anticorpos acima do limiar protetor e amplia o pool de células de memória.",
    criterios: [
      {
        descricao: "Diferenciar resposta primária (lenta, baixa) da secundária (rápida, intensa)",
        peso: 0.3,
        palavrasChave: ["primária", "secundária", "lenta", "rápida", "latência", "pico", "anticorpo", "afinidade"],
      },
      {
        descricao: "Citar linfócitos B, plasmócitos e células de memória",
        peso: 0.25,
        palavrasChave: ["linfócito b", "plasmócito", "célula de memória", "linfócito t helper", "antígeno"],
      },
      {
        descricao: "Explicar papel das células de memória na resposta secundária",
        peso: 0.25,
        palavrasChave: ["memória", "reconhecimento", "rápido", "intensidade", "quantidade", "afinidade"],
      },
      {
        descricao: "Justificar o reforço vacinal",
        peso: 0.2,
        palavrasChave: ["reforço", "limiar", "protetor", "duradouro", "título", "anticorpo", "pool"],
      },
    ],
    palavrasEssenciais: ["resposta primária", "resposta secundária", "linfócito", "anticorpo", "memória"],
    palavrasDesejaveis: ["plasmócito", "t helper", "afinidade", "latência", "hipermutação", "limiar protetor"],
    armadilhas: [
      {
        erro: "dizer que a vacina contém o vírus ativo causando a doença",
        correcao: "a tríplice viral é vacina atenuada (vírus vivo enfraquecido), não causa doença em imunocompetentes, mas estimula a resposta imune",
      },
      {
        erro: "confundir resposta imune humoral (anticorpos) com celular (linfócitos T citotóxicos)",
        correcao: "vacinas ativam principalmente a resposta humoral (linfócitos B → anticorpos); a celular é mais importante contra vírus intracelulares e câncer",
      },
    ],
    dicaDeOuro:
      "UERJ ama o gráfico de curva de anticorpos: 1ª dose = curva baixa e lenta; reforço = curva alta e rápida. Sempre cite: células B de memória + plasmócitos + linfócitos T helper.",
    pontuacaoMaxima: 1.0,
  },

  // ================= QUÍMICA =================
  {
    id: "disc-qui-01",
    disciplina: "quimica",
    tema: "Cinética química",
    subtema: "Fatores que afetam a velocidade de reação",
    apoio: {
      texto:
        "A decomposição da água oxigenada (H₂O₂) é lenta à temperatura ambiente, mas acelera significativamente com a adição de dióxido de manganês (MnO₂) ou com o aquecimento da solução. Em ferimentos, a catalase presente no sangue também acelera essa decomposição.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Explique, em termos de energia de ativação e teoria das colisões, como (a) o MnO₂ e (b) o aumento de temperatura aceleram a decomposição do H₂O₂. Diferencie o papel do catalisador do papel da temperatura.",
    gabarito:
      "(a) O MnO₂ atua como catalisador, oferecendo um caminho reacional alternativo com menor energia de ativação (Ea). Segundo a teoria das colisões, com Ea menor, uma fração maior das colisões entre moléculas de H₂O₂ possui energia suficiente para reagir (colisões efetivas), aumentando a velocidade. O catalisador não é consumido na reação e não altera o ΔH nem o equilíbrio. (b) O aumento da temperatura eleva a energia cinética média das moléculas, aumentando tanto a frequência das colisões quanto, principalmente, a fração de moléculas com energia igual ou superior à Ea (distribuição de Maxwell-Boltzmann). Diferença fundamental: o catalisador reduz a Ea (muda o mecanismo); a temperatura aumenta a energia das moléculas (não muda o mecanismo, mas mais moléculas atingem a Ea original).",
    criterios: [
      {
        descricao: "Explicar papel do catalisador: reduz Ea, caminho alternativo",
        peso: 0.3,
        palavrasChave: ["catalisador", "energia de ativação", "ea", "caminho alternativo", "mecanismo", "mnO₂"],
      },
      {
        descricao: "Relacionar Ea menor a mais colisões efetivas (teoria das colisões)",
        peso: 0.2,
        palavrasChave: ["colisão", "efetiva", "fração", "energia suficiente", "teoria das colisões"],
      },
      {
        descricao: "Explicar efeito da temperatura: aumenta energia cinética e fração de moléculas com E ≥ Ea",
        peso: 0.3,
        palavrasChave: ["temperatura", "energia cinética", "maxwell", "boltzmann", "fração", "colisão", "frequência"],
      },
      {
        descricao: "Diferenciar catalisador (muda Ea) de temperatura (não muda Ea, aumenta E das moléculas)",
        peso: 0.2,
        palavrasChave: ["diferença", "catalisador", "temperatura", "mecanismo", "energia de ativação", "consumido"],
      },
    ],
    palavrasEssenciais: ["energia de ativação", "catalisador", "temperatura", "colisão"],
    palavrasDesejaveis: ["maxwell-boltzmann", "colisão efetiva", "caminho alternativo", "energia cinética", "fração"],
    armadilhas: [
      {
        erro: "dizer que o catalisador aumenta a energia das moléculas",
        correcao: "o catalisador REDUZ a energia de ativação; não altera a energia das moléculas",
      },
      {
        erro: "dizer que o catalisador é consumido na reação",
        correcao: "o catalisador participa do mecanismo mas é regenerado; não é consumido nem aparece no balance final",
      },
    ],
    dicaDeOuro:
      "UERJ cobra: catalisador = reduz Ea (muda mecanismo); temperatura = aumenta E cinética (não muda mecanismo). Sempre cite 'teoria das colisões' e 'colisões efetivas'.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-qui-02",
    disciplina: "quimica",
    tema: "Equilíbrio químico",
    subtema: "Princípio de Le Chatelier e aplicações",
    apoio: {
      texto:
        "O transporte de oxigênio no sangue é feito pela hemoglobina (Hb), que se liga ao O₂ nos pulmões e o libera nos tecidos: Hb(aq) + 4 O₂(g) ⇌ Hb(O₂)₄(aq). Nos pulmões, a alta pressão parcial de O₂ favorece a formação de oxiemoglobina; nos tecidos metabolicamente ativos, a baixa pressão de O₂ e a alta concentração de CO₂ favorecem a liberação de O₂.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Utilizando o Princípio de Le Chatelier, explique por que a hemoglobina liga O₂ nos pulmões e o libera nos tecidos. Relacione sua resposta com as concentrações (pressões parciais) de O₂ e CO₂ em cada local.",
    gabarito:
      "Nos pulmões, a alta pressão parcial de O₂ (alta concentração de reagente) desloca o equilíbrio para a direita (sentido dos produtos), favorecendo a formação de Hb(O₂)₄ (oxiemoglobina). Nos tecidos metabolicamente ativos, a baixa pressão parcial de O₂ (baixa concentração de reagente) desloca o equilíbrio para a esquerda (sentido dos reagentes), favorecendo a liberação de O₂. Além disso, o CO₂ produzido no metabolismo reage com a água formando H⁺ (efeito Bohr), que protona a hemoglobina e reduz sua afinidade pelo O₂, deslocando ainda mais o equilíbrio para a esquerda e intensificando a liberação de O₂ nos tecidos.",
    criterios: [
      {
        descricao: "Aplicar Le Chatelier nos pulmões: alta [O₂] desloca para produtos",
        peso: 0.3,
        palavrasChave: ["pulmão", "alta pressão", "alta concentração", "desloca", "direita", "produtos", "oxiemoglobina"],
      },
      {
        descricao: "Aplicar Le Chatelier nos tecidos: baixa [O₂] desloca para reagentes",
        peso: 0.3,
        palavrasChave: ["tecido", "baixa pressão", "baixa concentração", "desloca", "esquerda", "reagentes", "libera"],
      },
      {
        descricao: "Mencionar efeito do CO₂ (efeito Bohr) na liberação de O₂",
        peso: 0.25,
        palavrasChave: ["co₂", "efeito bohr", "h⁺", "próton", "afinidade", "metabolismo", "ácido"],
      },
      {
        descricao: "Relacionar deslocamento com função fisiológica (transporte de O₂)",
        peso: 0.15,
        palavrasChave: ["transporte", "oxigênio", "função", "fisiológico", "hemoglobina", "equilíbrio"],
      },
    ],
    palavrasEssenciais: ["le chatelier", "desloca", "oxigênio", "pulmão", "tecido"],
    palavrasDesejaveis: ["pressão parcial", "oxiemoglobina", "efeito bohr", "co₂", "h⁺", "afinidade"],
    armadilhas: [
      {
        erro: "dizer que o equilíbrio se desloca para 'aumentar' a concentração de O₂",
        correcao: "o equilíbrio se desloca para MINIMIZAR a perturbação (Le Chatelier): se [O₂]↑, vai para produtos; se [O₂]↓, vai para reagentes",
      },
      {
        erro: "confundir deslocamento com mudança na constante de equilíbrio K",
        correcao: "mudanças de concentração deslocam o equilíbrio mas NÃO alteram K; apenas temperatura muda K",
      },
    ],
    dicaDeOuro:
      "UERJ adora questões interdisciplinares bio-química. Sempre cite: 'desloca para a direita/esquerda' + 'sentido dos produtos/reagentes' + justifique com [reagente] ou [produto].",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-qui-03",
    disciplina: "quimica",
    tema: "Química orgânica",
    subtema: "Funções orgânicas e reatividade",
    apoio: {
      texto:
        "A aspirina (ácido acetilsalicílico) é um fármaco amplamente utilizado como analgésico e antiagregante plaquetário. Sua estrutura contém um anel benzênico substituído por um grupo carboxílico (–COOH) e um grupo éster (–O–CO–CH₃). Em meio básico, a aspirina sofre hidrólise, regenerando ácido salicílico e acetato.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "(a) Identifique as funções orgânicas presentes na aspirina. (b) Escreva a equação da hidrólise básica da aspirina e explique por que essa reação é irreversível em meio básico.",
    gabarito:
      "(a) A aspirina contém: ácido carboxílico (–COOH) e éster (–O–CO–CH₃), além do anel aromático (benzeno). (b) A hidrólise básica (saponificação) do éster: C₆H₄(COOH)(OCOCH₃) + NaOH → C₆H₄(COOH)(OH) + CH₃COONa. A reação é irreversível em meio básico porque o produto da hidrólise do éster é o ácido carboxílico (ácido salicílico) e o álcool (fenol), mas em meio básico o ácido carboxílico é imediatamente desprotonado, formando o sal (carboxilato), que não reage com o álcool para regenerar o éster. A formação do sal desloca o equilíbrio completamente para os produtos.",
    criterios: [
      {
        descricao: "Identificar ácido carboxílico e éster",
        peso: 0.3,
        palavrasChave: ["ácido carboxílico", "éster", "–cooh", "–o–co–", "função orgânica"],
      },
      {
        descricao: "Escrever equação da hidrólise básica (saponificação)",
        peso: 0.3,
        palavrasChave: ["hidrólise", "saponificação", "naoh", "base", "ácido salicílico", "acetato", "sal"],
      },
      {
        descricao: "Explicar irreversibilidade pela formação do sal (carboxilato)",
        peso: 0.25,
        palavrasChave: ["irreversível", "sal", "carboxilato", "desprotonado", "base", "equilíbrio", "desloca"],
      },
      {
        descricao: "Mencionar anel aromático/benzeno",
        peso: 0.15,
        palavrasChave: ["anel", "aromático", "benzeno", "benzênico"],
      },
    ],
    palavrasEssenciais: ["ácido carboxílico", "éster", "hidrólise", "base"],
    palavrasDesejaveis: ["saponificação", "carboxilato", "sal", "irreversível", "anel aromático", "benzeno"],
    armadilhas: [
      {
        erro: "identificar álcool no lugar de fenol",
        correcao: "o grupo –OH ligado diretamente ao anel aromático é FENOL, não álcool",
      },
      {
        erro: "dizer que a hidrólise básica é reversível",
        correcao: "em meio básico, a formação do sal (carboxilato) torna a reação irreversível; a hidrólise ácida é reversível",
      },
    ],
    dicaDeOuro:
      "UERJ ama fármacos: aspirina (ácido + éster), paracetamol (amida + fenol), ibuprofeno (ácido carboxílico). Sempre identifique TODAS as funções, incluindo o anel aromático.",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-qui-04",
    disciplina: "quimica",
    tema: "Termoquímica",
    subtema: "Lei de Hess e cálculos de entalpia",
    apoio: {
      texto:
        "A combustão completa da glicose (C₆H₁₂O₆) é a principal fonte de energia para o organismo humano: C₆H₁₂O₆(s) + 6 O₂(g) → 6 CO₂(g) + 6 H₂O(l), ΔH = –2800 kJ/mol. Em condições anaeróbicas, a fermentação láctica da glicose produz ácido láctico: C₆H₁₂O₆ → 2 C₃H₆O₃, ΔH = –120 kJ/mol.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "Calcule a variação de entalpia da oxidação completa do ácido láctico a CO₂ e H₂O e explique por que a respiração aeróbia é mais eficiente energeticamente que a fermentação.",
    gabarito:
      "Pela Lei de Hess, a oxidação do ácido láctico pode ser obtida pela diferença: (combustão da glicose) – (fermentação da glicose). C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O, ΔH₁ = –2800 kJ; C₆H₁₂O₆ → 2 C₃H₆O₃, ΔH₂ = –120 kJ. Invertendo a segunda: 2 C₃H₆O₃ → C₆H₁₂O₆, ΔH = +120 kJ. Somando: 2 C₃H₆O₃ + 6 O₂ → 6 CO₂ + 6 H₂O, ΔH = –2800 + 120 = –2680 kJ (para 2 mols de ácido láctico). Portanto, ΔH da oxidação de 1 mol de ácido láctico = –1340 kJ/mol. A respiração aeróbia é mais eficiente porque libera 2800 kJ/mol de glicose, enquanto a fermentação libera apenas 120 kJ/mol — a diferença (2680 kJ) é recuperada na oxidação do ácido láctico. A fermentação produz apenas 2 ATP por glicose; a respiração aeróbia produz 30-32 ATP.",
    criterios: [
      {
        descricao: "Aplicar Lei de Hess corretamente (inverter e somar equações)",
        peso: 0.35,
        palavrasChave: ["lei de hess", "inverter", "somar", "entalpia", "Δh", "cálculo"],
      },
      {
        descricao: "Calcular ΔH da oxidação do ácido láctico (–1340 kJ/mol)",
        peso: 0.3,
        palavrasChave: ["–1340", "–2680", "oxidação", "ácido láctico", "kj"],
      },
      {
        descricao: "Comparar eficiência energética (2800 vs 120 kJ; 30-32 vs 2 ATP)",
        peso: 0.25,
        palavrasChave: ["eficiência", "energia", "atp", "aeróbia", "fermentação", "2800", "120", "30", "32"],
      },
      {
        descricao: "Explicar por que a respiração aeróbia é mais eficiente",
        peso: 0.1,
        palavrasChave: ["oxigênio", "completa", "oxidação", "eficiente", "diferença"],
      },
    ],
    palavrasEssenciais: ["lei de hess", "entalpia", "Δh", "oxidação", "ácido láctico"],
    palavrasDesejaveis: ["–1340", "atp", "aeróbia", "fermentação", "inverter", "somar"],
    armadilhas: [
      {
        erro: "esquecer de inverter o sinal ao inverter a equação",
        correcao: "ao inverter uma equação termoquímica, o sinal de ΔH muda (exotérmica ↔ endotérmica)",
      },
      {
        erro: "confundir ΔH da reação com ΔH por mol de substrato",
        correcao: "a fermentação produz 2 mols de ácido láctico; o ΔH calculado (–2680 kJ) é para 2 mols; divida por 2 para obter –1340 kJ/mol",
      },
    ],
    dicaDeOuro:
      "Lei de Hess é álgebra: inverteu → troca sinal; multiplicou → multiplica ΔH. UERJ adora comparações bio-química: respiração (2800 kJ, 30-32 ATP) vs fermentação (120 kJ, 2 ATP).",
    pontuacaoMaxima: 1.0,
  },
  {
    id: "disc-qui-05",
    disciplina: "quimica",
    tema: "Eletroquímica",
    subtema: "Pilhas e eletrólise",
    apoio: {
      texto:
        "A corrosão do ferro em presença de água e oxigênio é um processo eletroquímico espontâneo que causa prejuízos bilionários anualmente. O ferro atua como ânodo, oxidando-se a Fe²⁺, enquanto o O₂ é reduzido a OH⁻ no cátodo. A proteção catódica é uma técnica utilizada para evitar a corrosão de estruturas metálicas.",
      fonte: "Adaptado de enunciado UERJ 3ª fase.",
    },
    comando:
      "(a) Escreva as semirreações de oxidação e redução na corrosão do ferro. (b) Explique o princípio da proteção catódica e dê um exemplo prático de sua aplicação.",
    gabarito:
      "(a) Ânodo (oxidação): Fe(s) → Fe²⁺(aq) + 2 e⁻. Cátodo (redução): O₂(g) + 2 H₂O(l) + 4 e⁻ → 4 OH⁻(aq). (b) A proteção catódica consiste em tornar a estrutura metálica a ser protegida o cátodo de uma pilha, impedindo sua oxidação. Isso pode ser feito de duas formas: (1) uso de um metal de sacrifício (ânodo de sacrifício) mais reativo que o ferro (ex.: zinco ou magnésio), que se oxida no lugar do ferro; (2) uso de uma fonte externa de corrente elétrica (proteção catódica impressa), que fornece elétrons à estrutura, mantendo-a como cátodo. Exemplo prático: tanques de armazenamento de combustível enterrados no solo são protegidos por ânodos de sacrifício de magnésio; cascos de navios são protegidos por blocos de zinco.",
    criterios: [
      {
        descricao: "Escrever semirreação de oxidação do ferro (Fe → Fe²⁺ + 2e⁻)",
        peso: 0.2,
        palavrasChave: ["fe", "oxidação", "ânodo", "fe²⁺", "2e⁻", "semirreação"],
      },
      {
        descricao: "Escrever semirreação de redução do O₂ (O₂ + 2H₂O + 4e⁻ → 4OH⁻)",
        peso: 0.2,
        palavrasChave: ["o₂", "redução", "cátodo", "oh⁻", "4e⁻", "h₂o", "semirreação"],
      },
      {
        descricao: "Explicar princípio da proteção catódica (estrutura como cátodo)",
        peso: 0.25,
        palavrasChave: ["proteção catódica", "cátodo", "oxidação", "impedir", "estrutura", "princípio"],
      },
      {
        descricao: "Citar ânodo de sacrifício ou fonte externa",
        peso: 0.2,
        palavrasChave: ["ânodo de sacrifício", "zinco", "magnésio", "fonte externa", "corrente", "mais reativo"],
      },
      {
        descricao: "Dar exemplo prático",
        peso: 0.15,
        palavrasChave: ["tanque", "navio", "tubo", "estrutura", "enterrado", "prático", "aplicação"],
      },
    ],
    palavrasEssenciais: ["oxidação", "redução", "fe", "o₂", "proteção catódica"],
    palavrasDesejaveis: ["ânodo de sacrifício", "zinco", "magnésio", "cátodo", "fonte externa", "tanque", "navio"],
    armadilhas: [
      {
        erro: "inverter as semirreações (dizer que o ferro é reduzido)",
        correcao: "na corrosão, o ferro OXIDA (perde elétrons); o O₂ REDUZ (ganha elétrons)",
      },
      {
        erro: "dizer que a proteção catódica usa um metal MENOS reativo que o ferro",
        correcao: "o ânodo de sacrifício deve ser MAIS reativo (menor potencial de redução) que o ferro, para se oxidar no lugar dele",
      },
    ],
    dicaDeOuro:
      "UERJ ama eletroquímica aplicada: corrosão, pilhas, eletrólise. Sempre cite: ânodo = oxidação; cátodo = redução. Na proteção catódica, a estrutura protegida vira CÁTODO.",
    pontuacaoMaxima: 1.0,
  },
];
