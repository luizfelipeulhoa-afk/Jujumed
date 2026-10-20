export type Disciplina2027 = "biologia" | "quimica" | "redacao";

export interface CriterioDsea {
  descricao: string;
  pontos: number;
}

export interface Questao2027 {
  id: string;
  disciplina: Disciplina2027;
  tema: string;
  apoio: string;
  comando: string;
  padraoDsea: string;
  criterios: CriterioDsea[];
  pontuacaoMaxima: number;
}

const criteriosCiencia = (identificacao: string, mecanismo: string): CriterioDsea[] => [
  { descricao: identificacao, pontos: 0.5 },
  { descricao: "Localizar corretamente o processo, estrutura ou etapa solicitada", pontos: 0.5 },
  { descricao: mecanismo, pontos: 1 },
];

type LinhaCiencia = [string, string, string, string, string, string, string];

const bioLinhas: LinhaCiencia[] = [
  ["bio-01", "Homeostase glicêmica", "Uma paciente apresenta hiperglicemia, poliúria e corpos cetônicos.", "Relacione a deficiência de insulina à poliúria e à cetonúria.", "A baixa ação da insulina reduz a captação celular de glicose, causa hiperglicemia e glicosúria; a glicose tubular arrasta água por osmose. O uso de lipídios eleva a produção hepática de corpos cetônicos.", "Identificar hiperglicemia e glicosúria", "Explicar a diurese osmótica e a cetogênese hepática"],
  ["bio-02", "Expressão gênica", "A anemia falciforme decorre de uma substituição na beta-globina.", "Explique como a alteração no DNA modifica a hemoglobina e a hemácia.", "A mutação altera o códon do RNA mensageiro e troca um aminoácido na tradução. A mudança de polaridade favorece a polimerização da HbS e deforma as hemácias em baixa tensão de oxigênio.", "Identificar mutação pontual e troca de aminoácido", "Explicar DNA–RNA–proteína e a polimerização da HbS"],
  ["bio-03", "Eutrofização", "Fertilizantes alcançam uma lagoa e ocorre mortandade de peixes.", "Explique a sequência de eventos até a morte dos peixes.", "O excesso de nutrientes causa floração de algas. A matéria orgânica é decomposta por bactérias aeróbias, que consomem o oxigênio dissolvido e provocam hipóxia nos peixes.", "Identificar o excesso de nutrientes como causa", "Explicar proliferação, decomposição, consumo de oxigênio e hipóxia"],
  ["bio-04", "Mitose e fármacos", "A vinblastina impede a polimerização de microtúbulos.", "Identifique a fase bloqueada e explique o mecanismo.", "O bloqueio ocorre na metáfase/prometáfase. Sem microtúbulos, o fuso não se liga adequadamente aos cinetócoros, o checkpoint permanece ativo e a anáfase não começa.", "Identificar metáfase ou prometáfase", "Relacionar microtúbulos, fuso, cinetócoros e checkpoint"],
  ["bio-05", "Memória imunológica", "A segunda dose de uma vacina produz resposta mais rápida e intensa.", "Compare as respostas primária e secundária.", "A resposta primária ativa linfócitos virgens e forma plasmócitos e células de memória. No reforço, células de memória proliferam rapidamente e geram mais anticorpos, de maior afinidade e duração.", "Identificar células de memória", "Comparar latência, intensidade, afinidade e duração das respostas"],
  ["bio-06", "Ventilação pulmonar", "Um atleta aumenta a frequência respiratória durante exercício intenso.", "Explique o controle desse aumento a partir do CO₂ sanguíneo.", "O CO₂ forma ácido carbônico e eleva H+, reduzindo o pH. Quimiorreceptores detectam essa variação e estimulam centros respiratórios no bulbo, aumentando ventilação e eliminação de CO₂.", "Identificar a queda do pH pelo aumento de CO₂", "Explicar quimiorrecepção, controle bulbar e ventilação"],
  ["bio-07", "Filtração renal", "A pressão arterial de um paciente cai abruptamente após hemorragia.", "Explique o efeito sobre a filtração glomerular e a resposta hormonal.", "A menor pressão hidrostática glomerular reduz a filtração. O sistema renina-angiotensina-aldosterona aumenta vasoconstrição e reabsorção de sódio e água, ajudando a restaurar pressão e volume.", "Identificar a redução da filtração glomerular", "Explicar a ativação e os efeitos do sistema renina-angiotensina-aldosterona"],
  ["bio-08", "Seleção natural", "Uma população bacteriana contém indivíduos resistentes antes do uso de antibiótico.", "Explique o aumento da resistência após o tratamento.", "Mutações prévias geram variação. O antibiótico seleciona bactérias resistentes, que sobrevivem, reproduzem-se e aumentam a frequência dos alelos de resistência; o fármaco não induz resistência dirigida.", "Identificar variação prévia e seleção", "Explicar sobrevivência diferencial e mudança de frequência gênica"],
  ["bio-09", "Fotossíntese", "Uma planta recebe luz, mas o estômato permanece fechado por falta de água.", "Relacione o fechamento estomático à produção de glicose.", "O fechamento reduz perda de água, mas também limita a entrada de CO₂. Com menos substrato para o ciclo de Calvin no estroma, cai a fixação de carbono e a síntese de carboidratos.", "Identificar a redução da entrada de CO₂", "Relacionar estômatos, ciclo de Calvin e síntese de glicose"],
  ["bio-10", "Transmissão sináptica", "Uma toxina bloqueia canais de cálcio no terminal pré-sináptico.", "Explique por que o impulso não é transmitido ao neurônio seguinte.", "Sem entrada de Ca²⁺, vesículas sinápticas não se fundem à membrana e o neurotransmissor não é liberado. Assim, receptores pós-sinápticos não são ativados e não surge potencial pós-sináptico.", "Identificar o papel do cálcio", "Explicar exocitose, neurotransmissor e resposta pós-sináptica"],
];
const bio: Questao2027[] = bioLinhas.map(([id, tema, apoio, comando, padraoDsea, identificacao, mecanismo]) => ({
  id, disciplina: "biologia" as const, tema, apoio, comando, padraoDsea,
  criterios: criteriosCiencia(identificacao, mecanismo), pontuacaoMaxima: 2,
}));

const quimicaLinhas: LinhaCiencia[] = [
  ["qui-01", "Cinética química", "MnO₂ e aquecimento aceleram a decomposição de H₂O₂.", "Diferencie o efeito do catalisador e o da temperatura.", "O catalisador oferece caminho de menor energia de ativação. O aquecimento aumenta energia cinética, frequência e fração de colisões eficazes, sem alterar a energia de ativação do mecanismo original.", "Identificar energia de ativação", "Diferenciar caminho alternativo de aumento da energia cinética"],
  ["qui-02", "Equilíbrio químico", "A hemoglobina liga O₂ nos pulmões e o libera nos tecidos.", "Explique o processo pelo princípio de Le Chatelier.", "Alta pressão de O₂ nos pulmões desloca o equilíbrio para a oxiemoglobina. Nos tecidos, menor O₂ e maior CO₂/H+ reduzem a afinidade e favorecem a liberação de oxigênio.", "Identificar as diferenças de pressão parcial", "Aplicar Le Chatelier nos pulmões e nos tecidos"],
  ["qui-03", "Funções orgânicas", "A aspirina contém grupos carboxila e éster.", "Identifique as funções e explique sua hidrólise básica.", "Há ácido carboxílico, éster e anel aromático. Na saponificação, o éster reage com base e forma carboxilato, tornando o processo praticamente irreversível.", "Identificar ácido carboxílico e éster", "Explicar saponificação e estabilização do carboxilato"],
  ["qui-04", "Termoquímica", "Combustão da glicose: −2800 kJ; fermentação: −120 kJ por mol de glicose.", "Calcule a energia ainda disponível nos produtos da fermentação.", "Pela lei de Hess, a oxidação dos produtos libera −2680 kJ por mol de glicose: −2800 − (−120). Isso explica a menor eficiência da fermentação.", "Identificar a aplicação da lei de Hess", "Efetuar a subtração algébrica e interpretar a eficiência"],
  ["qui-05", "Eletroquímica", "Na corrosão, Fe é oxidado e O₂ é reduzido.", "Explique a proteção catódica por metal de sacrifício.", "Um metal mais reativo, como zinco ou magnésio, funciona como ânodo e se oxida. A estrutura de ferro recebe elétrons, torna-se cátodo e não sofre oxidação.", "Identificar ânodo e cátodo", "Explicar fluxo de elétrons e escolha do metal mais reativo"],
  ["qui-06", "Soluções e osmose", "Soro fisiológico inadequadamente concentrado pode lesar hemácias.", "Explique o que ocorre em meios hipotônico e hipertônico.", "Em meio hipotônico, água entra por osmose e pode causar hemólise. Em meio hipertônico, água sai e ocorre crenação. A solução isotônica evita fluxo líquido expressivo.", "Identificar os sentidos do fluxo de água", "Relacionar tonicidade, osmose, hemólise e crenação"],
  ["qui-07", "Ácido-base", "O sangue possui sistema tampão H₂CO₃/HCO₃⁻.", "Explique como o tampão responde à adição de ácido.", "O HCO₃⁻ consome H+ formando H₂CO₃, que pode gerar CO₂ e água. O equilíbrio reduz a variação de pH sem impedi-la completamente.", "Identificar a base conjugada bicarbonato", "Explicar consumo de H+ e deslocamento do equilíbrio"],
  ["qui-08", "Estequiometria", "Um antiácido contém 0,84 g de NaHCO₃ (M=84 g/mol).", "Calcule a quantidade de HCl neutralizada em mol.", "Há 0,010 mol de NaHCO₃. Pela reação 1:1 com HCl, são neutralizados 0,010 mol de HCl.", "Calcular 0,010 mol de bicarbonato", "Usar corretamente a proporção estequiométrica 1:1"],
  ["qui-09", "Radioatividade", "Um radioisótopo de meia-vida 6 h inicia com atividade 800 unidades.", "Determine a atividade após 18 h e justifique.", "Em 18 h passam três meias-vidas: 800 → 400 → 200 → 100. A atividade final é 100 unidades, ou um oitavo da inicial.", "Identificar três meias-vidas", "Aplicar decaimento sucessivo e chegar a 100 unidades"],
  ["qui-10", "Solubilidade", "A dissolução de um sal é endotérmica.", "Explique o efeito do aumento de temperatura sobre a solubilidade.", "Como o calor atua como reagente no equilíbrio endotérmico, elevar a temperatura desloca o processo para a dissolução e tende a aumentar a solubilidade do sal.", "Identificar o caráter endotérmico", "Aplicar Le Chatelier relacionando calor e dissolução"],
];
const quimica: Questao2027[] = quimicaLinhas.map(([id, tema, apoio, comando, padraoDsea, identificacao, mecanismo]) => ({
  id, disciplina: "quimica" as const, tema, apoio, comando, padraoDsea,
  criterios: criteriosCiencia(identificacao, mecanismo), pontuacaoMaxima: 2,
}));

export const PROPOSTA_REDACAO: Questao2027 = {
  id: "redacao-01",
  disciplina: "redacao",
  tema: "O bem-amado · poder, linguagem e cidadania",
  apoio: "Em O bem-amado, Dias Gomes expõe o uso da linguagem política, do personalismo e da obra pública como instrumentos de poder em Sucupira.",
  comando: "Escreva um texto argumentativo de 20 a 30 linhas sobre como a manipulação do discurso político afeta a cidadania, articulando a obra O bem-amado a um problema sociopolítico brasileiro.",
  padraoDsea: "Espera-se tese clara, leitura pertinente da obra, análise sociopolítica consistente, argumentos articulados, progressão lógica e domínio da norma escrita, sem resumo do enredo como eixo central.",
  criterios: [
    { descricao: "Tese e atendimento ao tema", pontos: 4 },
    { descricao: "Leitura crítica de O bem-amado", pontos: 4 },
    { descricao: "Argumentação e repertório sociopolítico", pontos: 5 },
    { descricao: "Coesão, progressão e organização", pontos: 4 },
    { descricao: "Norma escrita e precisão vocabular", pontos: 3 },
  ],
  pontuacaoMaxima: 20,
};

export const CADERNOS_2027 = { biologia: bio, quimica, redacao: [PROPOSTA_REDACAO] };

export const GUIA_O_BEM_AMADO = {
  obra: "O bem-amado",
  autor: "Dias Gomes",
  guia: "Leia a sátira política observando como Odorico Paraguaçu transforma linguagem, símbolos públicos e relações pessoais em instrumentos de legitimação do poder.",
  eixos: ["Personalismo e coronelismo", "Retórica política e desinformação", "Interesse público versus vaidade", "Cidadania e participação social"],
};