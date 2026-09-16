export type AreaId = "literatura" | "biologia" | "quimica" | "fisicamat" | "humanas";

export interface Question {
  id: string;
  area: AreaId;
  tema: string;
  apoio?: { texto: string; fonte: string };
  enunciado: string;
  alternativas: Record<"A" | "B" | "C" | "D", string>;
  gabarito: "A" | "B" | "C" | "D";
  /** Por que a alternativa correta é a verdadeira */
  explicacaoCorreta: string;
  /** Por que cada distrator está incorreto (feedback específico à escolha) */
  porQueErrada: Partial<Record<"A" | "B" | "C" | "D", string>>;
  dicaDeOuro: string;
}

export const AREAS: Record<AreaId, { nome: string; cor: string; corSoft: string }> = {
  literatura: { nome: "Literatura · O Cortiço", cor: "#e03a48", corSoft: "rgba(224,58,72,0.14)" },
  biologia: { nome: "Biologia", cor: "#2fbf8f", corSoft: "rgba(47,191,143,0.14)" },
  quimica: { nome: "Química", cor: "#5b8def", corSoft: "rgba(91,141,239,0.14)" },
  fisicamat: { nome: "Física & Matemática", cor: "#e8b54d", corSoft: "rgba(232,181,77,0.14)" },
  humanas: { nome: "Ciências Humanas", cor: "#3fb6ae", corSoft: "rgba(63,182,174,0.14)" },
};

export const QUESTIONS: Question[] = [
  {
    id: "lit-zoomorfizacao",
    area: "literatura",
    tema: "Zoomorfização do espaço",
    apoio: {
      texto:
        "“Eram cinco horas da manhã e o cortiço acordava, abrindo, não os olhos, mas a sua infinidade de portas e janelas alinhadas. […] Sentia-se naquela fermentação sanguínea, naquela gula viçosa de plantas rasteiras que mergulham o pé vigoroso na lama preta e nutriente da vida, o prazer animal de existir, a triunfante satisfação de respirar sobre a terra.”",
      fonte: "AZEVEDO, Aluísio. O Cortiço, 1890 (adaptado).",
    },
    enunciado:
      "No trecho, o narrador descreve o despertar da habitação coletiva valendo-se de um procedimento típico do Naturalismo, que consiste em:",
    alternativas: {
      A: "idealizar o espaço urbano como refúgio de harmonia entre as classes sociais.",
      B: "conferir ao espaço atributos de organismo vivo, movido por impulsos quase animais.",
      C: "denunciar, por meio de linguagem jornalística, as condições sanitárias das habitações.",
      D: "apresentar o cotidiano dos moradores a partir de um ponto de vista confessional e subjetivo.",
    },
    gabarito: "B",
    explicacaoCorreta:
      "O cortiço “acorda”, tem “gula”, sente “prazer animal de existir”: o narrador aplica ao prédio verbos e sensações de um ser vivo — a zoomorfização (ou zoantropização) do espaço. Essa é a assinatura estética de Aluísio Azevedo: o ambiente deixa de ser cenário e vira personagem, um organismo que engole e transforma quem vive nele.",
    porQueErrada: {
      A: "A idealização harmoniosa é procedimento romântico — o oposto do Naturalismo, que expõe o conflito e a degradação sem maquiagem.",
      C: "A linguagem aqui não é jornalística, e sim carregada de metáforas orgânicas. A denúncia naturalista se faz pela ciência do determinismo, não pelo tom de reportagem.",
      D: "O narrador é onisciente e de pretensão objetiva/científica, em 3ª pessoa — não há confissão nem subjetivismo de personagem.",
    },
    dicaDeOuro:
      "O cortiço É o protagonista. Sempre que a UERJ trouxer um trecho em que o prédio “sente”, “respira” ou “devora”, marque a alternativa que fala em organismo vivo/zoomorfização — é a questão mais recorrente sobre o livro.",
  },
  {
    id: "lit-determinismo",
    area: "literatura",
    tema: "Determinismo do meio",
    apoio: {
      texto:
        "Jerônimo, português trabalhador e sóbrio, vai aos poucos se “abrasileirando”: abandona a rotina disciplinada, apaixona-se por Rita Baiana, passa a beber cachaça e comete um crime por ela. O narrador atribui a metamorfose ao clima tropical, à convivência no cortiço e à sensualidade do ambiente.",
      fonte: "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
    },
    enunciado:
      "A transformação de Jerônimo ao longo do romance ilustra qual princípio caro ao Naturalismo?",
    alternativas: {
      A: "A predestinação divina, que pune o imigrante por seu orgulho excessivo.",
      B: "A hereditariedade, que desperta nele traços atávicos de sua família em Portugal.",
      C: "O determinismo do meio, que molda o indivíduo conforme as circunstâncias que o cercam.",
      D: "O livre-arbítrio do personagem, que escolhe conscientemente ascender na vida.",
    },
    gabarito: "C",
    explicacaoCorreta:
      "O Naturalismo aplica ao romance a lógica das ciências: o homem é produto da raça, do meio e do momento (tese de Taine). Em Jerônimo, é o MEIO — o cortiço, o clima, a cultura popular carioca — que o modifica por inteiro. Ele não “escolhe” mudar; o ambiente o digere e o refaz.",
    porQueErrada: {
      A: "Não há plano religioso no Naturalismo: a lente é científica, não moral ou divina. Castigo divino pertence a outra estética.",
      B: "A hereditariedade também opera no livro (pense em Pombinha, filha de prostituta), mas o trecho aponta o meio como motor da mudança de Jerônimo.",
      D: "O Naturalismo nega o livre-arbítrio: o personagem é resultado de forças que não controla. “Escolha consciente” é leitura liberal, não naturalista.",
    },
    dicaDeOuro:
      "Naturalismo = “o homem é fruto do meio”. Se a questão mostra alguém MUDANDO por causa do cortiço, a resposta quase sempre envolve determinismo do meio. Macete da tríade: raça + meio + momento.",
  },
  {
    id: "lit-joao-romao",
    area: "literatura",
    tema: "Ascensão de João Romão",
    apoio: {
      texto:
        "João Romão começou com uma vendinha e um cortiço. Economia obsessiva, pequenos furtos de material de construção, exploração do trabalho de Bertoleza — mulher escravizada a quem fez crer que estava alforriada — e a expansão incessante das casinhas, até erguer sobradinhos e sonhar com o título de barão.",
      fonte: "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
    },
    enunciado: "A trajetória de João Romão no romance corporifica:",
    alternativas: {
      A: "a crítica à acumulação primitiva de capital, feita à custa da exploração do trabalho alheio e do logro.",
      B: "a defesa da mobilidade social alcançada exclusivamente pelo trabalho honesto do imigrante.",
      C: "a condenação da industrialização nascente pelas elites agrárias do Segundo Reinado.",
      D: "a apologia do self-made man como modelo do liberalismo tropical brasileiro.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "Aluísio Azevedo mostra a gênese do capital de Romão pelo avesso: roubo miúdo, usura e, sobretudo, a exploração do corpo e do trabalho de Bertoleza. A ascensão não é exemplar — é denunciada. O romance expõe que a fortuna “respeitável” do fim nasce da espoliação do início.",
    porQueErrada: {
      B: "O romance faz o contrário de defender essa tese: mostra que o “trabalho” de Romão era feito de trapaça e exploração — a honestidade é fachada.",
      C: "Romão é comerciante e senhor de cortiço urbano, não representante de elite agrária; a questão da industrialização não é o eixo da obra.",
      D: "Não há apologia: o narrador expõe a brutalidade por trás do sucesso. “Self-made man” seria leitura ingênua que o texto desmonta.",
    },
    dicaDeOuro:
      "Pergunta clássica: “a ascensão de João Romão representa…”. Fuja das alternativas elogiosas (mérito, honestidade, esforço). A banca quer a leitura crítica: exploração + acumulação primitiva.",
  },
  {
    id: "lit-bertoleza",
    area: "literatura",
    tema: "A tragédia de Bertoleza",
    apoio: {
      texto:
        "Bertoleza trabalha de sol a sol: lava, cozinha, carrega pedra para as construções de João Romão, que falsifica sua carta de alforria. Quando ele decide casar-se com Zulmira e tornar-se “capitalista”, os antigos donos a reclamam como escravizada — e ela tira a própria vida com uma facada no ventre.",
      fonte: "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
    },
    enunciado: "O destino de Bertoleza funciona no romance como:",
    alternativas: {
      A: "um subplot romântico que suaviza a aspereza do enredo naturalista.",
      B: "exposição dramática da estrutura escravista que persiste após a Abolição e sustenta a acumulação do senhor.",
      C: "evidência da superioridade feminina na administração do cortiço.",
      D: "crítica à recusa dos libertos em se integrarem ao trabalho assalariado.",
    },
    gabarito: "B",
    explicacaoCorreta:
      "O romance é de 1890, dois anos após a Lei Áurea. Bertoleza é a população negra liberta traída pela Abolição sem reparação: sua “liberdade” era uma falsificação. O suicídio, no momento em que seria reescravizada, denuncia que a fortuna de Romão — e o “progresso” do Brasil — ergueu-se sobre esse corpo explorado até o fim.",
    porQueErrada: {
      A: "Não há suavização: a morte de Bertoleza é o ponto mais brutal do livro, e o romance romântico é exatamente o que o Naturalismo combate.",
      C: "Reduzir Bertoleza à “administração do cortiço” ignora sua condição de explorada — o foco é a violência da estrutura, não gestão doméstica.",
      D: "A alternativa inverte a vítima em culpada: Bertoleza não recusa o trabalho; ela é roubada em sua liberdade. É a estrutura que a exclui.",
    },
    dicaDeOuro:
      "Bertoleza = o custo humano da ascensão de Romão. A UERJ adora ligá-la ao contexto pós-Abolição (1888→1890): liberdade formal sem liberdade real. Grave essa data: o romance é de 1890.",
  },
  {
    id: "lit-protagonista-coletivo",
    area: "literatura",
    tema: "Protagonista coletivo",
    apoio: {
      texto:
        "A narrativa descreve a multidão de moradores como um formigueiro humano com ritmo próprio: acordam, brigam, amam e trabalham em fluxo contínuo, e as histórias individuais se diluem no movimento do conjunto. Ao mesmo tempo, o cortiço trava com o sobrado do Miranda uma rivalidade que organiza todo o espaço.",
      fonte: "Síntese crítica de O Cortiço (AZEVEDO, 1890).",
    },
    enunciado: "A partir dessa organização narrativa, é correto concluir que, em O Cortiço:",
    alternativas: {
      A: "o protagonismo é do espaço coletivo, que condensa as tensões sociais do Rio de Janeiro do fim do Império.",
      B: "a narração privilegia a profundidade psicológica da aristocracia do sobrado.",
      C: "os conflitos sociais se resolvem pelo diálogo entre moradores e o barão.",
      D: "a habitação coletiva é retratada como espaço harmônico, sem hierarquias internas.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "O Cortiço inaugura o protagonista coletivo na literatura brasileira: mais importante que qualquer indivíduo é o organismo-cortiço, com sua massa anônima e seus conflitos — cortiço (popular) × sobrado (elite), Brasil mestiço × Europa burguesa. As pessoas passam; o cortiço permanece e cresce.",
    porQueErrada: {
      B: "O sobrado e o Miranda são coadjuvantes da rivalidade; o foco narrativo é o cortiço e sua gente miúda, não a psicologia da elite.",
      C: "Não há conciliação: o romance é movido por brigas, incêndio e disputa de espaço. A tensão social nunca se resolve por diálogo.",
      D: "O cortiço é profundamente hierarquizado: Romão no topo, moradores, sublocatários, e Bertoleza na base absoluta da pirâmide.",
    },
    dicaDeOuro:
      "“Quem é o protagonista de O Cortiço?” — o próprio cortiço. Questão recorrente: protagonista coletivo + cortiço × sobrado como alegoria do Brasil. Decore esse par.",
  },
  {
    id: "bio-glicemia",
    area: "biologia",
    tema: "Homeostase glicêmica",
    apoio: {
      texto:
        "Após um almoço rico em massas, a glicemia de uma estudante sobe de ~90 mg/dL para ~140 mg/dL. Duas horas depois, sem qualquer lanche intermediário, o valor já retornou ao patamar basal.",
      fonte: "Situação-problema elaborada no padrão UERJ.",
    },
    enunciado:
      "Na fase de queda da glicemia, o hormônio predominante e seu principal efeito no fígado são, respectivamente:",
    alternativas: {
      A: "glucagon — estímulo da glicogenólise hepática.",
      B: "insulina — estímulo da glicogênese e da captação de glicose pelas células.",
      C: "glucagon — inibição da captação de glicose pelas células.",
      D: "insulina — estímulo da gliconeogênese hepática.",
    },
    gabarito: "B",
    explicacaoCorreta:
      "Hiperglicemia pós-refeição é detectada pelas células β das ilhotas pancreáticas, que secretam insulina. No fígado, a insulina ativa a glicogênese (glicose → glicogênio) e, nos músculos e tecido adiposo, promove a entrada de glicose via transportadores GLUT4. Resultado: a glicemia cai de volta ao set point.",
    porQueErrada: {
      A: "Glucagon com glicogenólise é a resposta do JEJUM (hipoglicemia), não do pós-refeição. Inverteria o quadro: elevaria ainda mais a glicemia.",
      C: "Além de o glucagon agir no jejum, seu efeito não é “inibir captação” — é liberar glicose hepática. E no pós-refeição quem reina é a insulina.",
      D: "A gliconeogênese (fabricar glicose nova) é efeito do glucagon no jejum. A insulina faz o oposto: armazena, não produz glicose.",
    },
    dicaDeOuro:
      "Dupla que a UERJ cobra todo ano: REFEIÇÃO = insulina (armazena: glicogênese); JEJUM = glucagon (libera: glicogenólise). Macete: “Insulina INTROduz glicose na célula”.",
  },
  {
    id: "bio-magnificacao",
    area: "biologia",
    tema: "Magnificação trófica",
    apoio: {
      texto:
        "Em uma lagoa fluminense, mediu-se a concentração de um pesticida organoclorado não biodegradável: água, 0,00005 ppm; plâncton, 0,04 ppm; peixes pequenos, 0,5 ppm; peixes grandes, 2 ppm; aves piscívoras, 25 ppm.",
      fonte: "Dados fictícios elaborados no padrão UERJ (baseados em estudos clássicos de DDT).",
    },
    enunciado:
      "Os dados ilustram o fenômeno da magnificação trófica, pois o contaminante:",
    alternativas: {
      A: "é diluído à medida que passa de um nível trófico para o seguinte.",
      B: "concentra-se progressivamente nos organismos dos níveis tróficos mais altos.",
      C: "é rapidamente metabolizado pelas aves, que por isso o acumulam.",
      D: "é absorvido apenas pelos produtores, que o retêm integralmente.",
    },
    gabarito: "B",
    explicacaoCorreta:
      "Organoclorados e metais pesados não são degradados nem excretados: acumulam-se nos tecidos (bioacumulação) e se CONCENTRAM a cada nível trófico, porque cada predador ingere muitas presas contaminadas (magnificação). Daí o salto de 0,00005 ppm na água para 25 ppm nas aves do topo — 500 mil vezes.",
    porQueErrada: {
      A: "É o contrário da diluição: a concentração AUMENTA ao longo da cadeia. Se fosse diluída, as aves teriam o menor valor.",
      C: "As aves acumulam justamente porque NÃO conseguem metabolizar o composto. Se o metabolizassem, ele seria eliminado, não acumulado.",
      D: "O contaminante passa por TODOS os níveis — a tabela mostra isso. Os produtores apenas iniciam o processo de concentração.",
    },
    dicaDeOuro:
      "Magnificação ≠ bioacumulação: magnificação é o AUMENTO ao longo da cadeia; a maior concentração está SEMPRE no predador de topo. Na UERJ, procure a ave/carnívoro no fim da teia.",
  },
  {
    id: "bio-fermentacao",
    area: "biologia",
    tema: "Respiração × fermentação láctica",
    apoio: {
      texto:
        "No fim de um treino intenso de corrida, a musculatura de uma atleta começa a “queimar”. Nas fibras musculares em déficit de oxigênio, passa a predominar a degradação parcial da glicose com produção de lactato.",
      fonte: "Situação-problema elaborada no padrão UERJ.",
    },
    enunciado:
      "Comparada à respiração celular aeróbia, a fermentação láctica fornece menos ATP porque:",
    alternativas: {
      A: "a glicose não é totalmente oxidada, e a etapa final do processo dispensa o oxigênio como aceptor de elétrons.",
      B: "o lactato produzido consome a maior parte do ATP gerado na glicólise.",
      C: "as mitocôndrias deixam de funcionar por falta de glicogênio muscular.",
      D: "o processo só ocorre quando não há glicose disponível no sangue.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "Sem O₂ como aceptor final de elétrons, a cadeia respiratória (fosforilação oxidativa) para — e é ela que produz a maior parte do ATP (~26-28 dos 30-32 totais). Resta a glicólise, com saldo de 2 ATP e a redução do piruvato a lactato para regenerar NAD⁺. A glicose é degradada só parcialmente, daí o baixo rendimento.",
    porQueErrada: {
      B: "O lactato não “consome ATP”: formar lactato a partir do piruvato apenas reoxida o NADH em NAD⁺, permitindo que a glicólise continue rendendo 2 ATP.",
      C: "Glicogênio é a reserva de glicose muscular — e é justamente o que há disponível durante o esforço. O limitante é o O₂, não o substrato.",
      D: "A fermentação ocorre COM glicose disponível; ela é ativada pelo déficit de oxigênio, não pela falta de glicose.",
    },
    dicaDeOuro:
      "Números-chave: fermentação = 2 ATP; respiração aeróbia = 30-32 ATP. Se a UERJ perguntar “por que rende menos?”, a resposta mora na ausência de O₂ como aceptor final / oxidação incompleta.",
  },
  {
    id: "qui-lechatelier",
    area: "quimica",
    tema: "Princípio de Le Chatelier",
    apoio: {
      texto:
        "Na síntese industrial da amônia (processo Haber-Bosch): N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g), ΔH = –92 kJ. O engenheiro do reator deseja aumentar o rendimento de NH₃ no equilíbrio.",
      fonte: "Situação-problema elaborada no padrão UERJ.",
    },
    enunciado:
      "Dentre as alterações abaixo, a que aumenta o rendimento de amônia em equilíbrio é:",
    alternativas: {
      A: "elevar a temperatura do reator, mantendo a pressão constante.",
      B: "adicionar um catalisador adequado ao sistema reacional.",
      C: "aumentar a pressão total sobre o sistema.",
      D: "remover continuamente N₂ do reator.",
    },
    gabarito: "C",
    explicacaoCorreta:
      "Pelo Princípio de Le Chatelier, aumentar a pressão desloca o equilíbrio para o lado com MENOS mols gasosos: são 4 mols nos reagentes (1 N₂ + 3 H₂) e 2 mols nos produtos — logo, o equilíbrio vai para o NH₃. (Na indústria usa-se ~200 atm exatamente por isso.)",
    porQueErrada: {
      A: "A reação é EXOTÉRMICA (ΔH < 0). Elevar a temperatura desloca o equilíbrio no sentido ENDOTÉRMICO — para os reagentes —, REDUZINDO o rendimento. (A indústria aquece por cinética, não por equilíbrio.)",
      B: "Pegadinha clássica: catalisador acelera a chegada ao equilíbrio, mas NÃO desloca o equilíbrio nem altera o rendimento. Erra quem marca por intuição.",
      D: "Remover um reagente desloca o equilíbrio para REPOr o reagente — ou seja, para a esquerda, consumindo NH₃ e diminuindo o rendimento.",
    },
    dicaDeOuro:
      "Catalisador NUNCA desloca equilíbrio — a UERJ coloca essa alternativa em quase toda prova de equilíbrio químico. Pressão → lado com menos mols de gás; temperatura → sentido que ABSORVE o calor adicionado.",
  },
  {
    id: "qui-funcoes",
    area: "quimica",
    tema: "Funções orgânicas em fármacos",
    apoio: {
      texto:
        "O ácido acetilsalicílico (AAS), analgésico e antiagregante plaquetário, possui um anel benzênico ligado a um grupo –COOH e a um grupo –O–CO–CH₃ (acetóxi).",
      fonte: "Descrição estrutural elaborada no padrão UERJ.",
    },
    enunciado:
      "As funções orgânicas oxigenadas presentes na molécula do AAS são:",
    alternativas: {
      A: "ácido carboxílico e éster.",
      B: "cetona e éter.",
      C: "aldeído e amida.",
      D: "álcool e ácido carboxílico.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "O grupo –COOH ligado ao anel é o ácido carboxílico (dá o “ácido” do nome). O grupo –O–CO–CH₃ é um éster: um oxigênio ponte ligado a um carbono de carbonila (–CO–O–). A molécula carrega as duas funções — por isso “ácido acetil-SALICÍLICO” é também um éster acetilado.",
    porQueErrada: {
      B: "Não há C=O “solto” entre carbonos (cetona) nem oxigênio entre dois carbonos saturados sem carbonila (éter simples). O –O–CO– é éster, uma função própria.",
      C: "Não há grupo –CHO (aldeído) nem nitrogênio na molécula — amida exige ligação C(=O)–N, ausente no AAS.",
      D: "Ácido carboxílico está correto, mas não há –OH ligado a carbono saturado (álcool). O –OH do –COOH pertence à função ácida.",
    },
    dicaDeOuro:
      "Viu oxigênio-ponte colado em C=O (–O–CO–)? É ÉSTER. A UERJ ama fármacos: AAS (ácido + éster), paracetamol (amida + fenol), salicilato de metila (éster). Leve esses três decorados.",
  },
  {
    id: "qui-hess",
    area: "quimica",
    tema: "Termoquímica · Lei de Hess",
    apoio: {
      texto:
        "Combustão do carbono: C(s, grafite) + O₂(g) → CO₂(g), ΔH₁ = –394 kJ. Combustão do monóxido: CO(g) + ½ O₂(g) → CO₂(g), ΔH₂ = –283 kJ.",
      fonte: "Dados termoquímicos elaborados no padrão UERJ.",
    },
    enunciado:
      "Pela Lei de Hess, a variação de entalpia da formação do monóxido de carbono, C(s) + ½ O₂(g) → CO(g), vale:",
    alternativas: {
      A: "–111 kJ",
      B: "–677 kJ",
      C: "+111 kJ",
      D: "+677 kJ",
    },
    gabarito: "A",
    explicacaoCorreta:
      "A formação do CO é a equação (1) menos a equação (2): mantemos (1) como está (C + O₂ → CO₂, –394) e invertemos (2) (CO₂ → CO + ½ O₂, +283). Somando, o CO₂ cancela e sobra C + ½ O₂ → CO, com ΔH = –394 + 283 = –111 kJ. Exotérmica, como toda combustão parcial de carbono.",
    porQueErrada: {
      B: "–677 kJ resulta de SOMAR as duas entalpias (–394 – 283), esquecendo que a equação (2) precisa ser invertida — e inverter equação inverte o sinal.",
      C: "+111 kJ acertaria o módulo, mas erraria o sinal: a formação do CO a partir de C e O₂ libera calor (exotérmica), não absorve.",
      D: "+677 kJ soma os módulos com sinal trocado — dois erros combinados: não inverteu a equação e trocou o sinal do resultado.",
    },
    dicaDeOuro:
      "Hess é álgebra de equações: inverteu → troca o sinal; multiplicou → multiplica o ΔH. Macete da formação do CO: ΔH(CO) = combustão do C − combustão do CO.",
  },
  {
    id: "fis-chuveiro",
    area: "fisicamat",
    tema: "Eletrodinâmica · potência e kWh",
    apoio: {
      texto:
        "Um chuveiro elétrico de 5.500 W é utilizado, em média, 30 minutos por dia, durante 30 dias. A tarifa de energia elétrica da residência é de R$ 0,90 por kWh.",
      fonte: "Situação-problema elaborada no padrão UERJ.",
    },
    enunciado:
      "O consumo mensal de energia do chuveiro e o custo correspondente valem, respectivamente:",
    alternativas: {
      A: "82,5 kWh e R$ 74,25.",
      B: "27,5 kWh e R$ 24,75.",
      C: "165,0 kWh e R$ 148,50.",
      D: "82,5 kWh e R$ 8,25.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "Converta antes de calcular: P = 5.500 W = 5,5 kW; t = 30 min = 0,5 h/dia. Energia diária = 5,5 × 0,5 = 2,75 kWh; em 30 dias, E = 2,75 × 30 = 82,5 kWh. Custo = 82,5 × R$ 0,90 = R$ 74,25. Repare que o chuveiro sozinho consome o que uma geladeira consome em dois meses.",
    porQueErrada: {
      B: "27,5 kWh viria de usar 10 dias em vez de 30 (2,75 × 10). O consumo diário está certo; foi o número de dias que caiu.",
      C: "165 kWh corresponde a 1 hora diária de banho (5,5 × 1 × 30). O enunciado fala em 30 minutos — metade disso.",
      D: "O consumo está correto, mas R$ 8,25 usa tarifa de R$ 0,10/kWh. A conta certa é 82,5 × 0,90.",
    },
    dicaDeOuro:
      "E(kWh) = P(kW) × t(h). Regra de ouro: converta W→kW e minutos→h ANTES de multiplicar, senão a banca te espera nas alternativas com vírgula no lugar errado.",
  },
  {
    id: "mat-probabilidade",
    area: "fisicamat",
    tema: "Probabilidade com conjuntos",
    apoio: {
      texto:
        "Em um cursinho pré-vestibular com 60 alunos, 36 resolvem as listas de Biologia, 28 resolvem as de Química e 12 resolvem as duas listas.",
      fonte: "Situação-problema elaborada no padrão UERJ.",
    },
    enunciado:
      "Sorteando-se ao acaso um aluno desse grupo, a probabilidade de ele NÃO resolver nenhuma das duas listas é:",
    alternativas: {
      A: "2/15",
      B: "1/5",
      C: "1/3",
      D: "4/15",
    },
    gabarito: "A",
    explicacaoCorreta:
      "Pela fórmula da união: n(B ∪ Q) = 36 + 28 – 12 = 52 alunos resolvem ao menos uma lista. Logo, 60 – 52 = 8 não resolvem nenhuma. Probabilidade = 8/60 = 2/15 (≈ 13,3%). O “– 12” evita contar os bilingues da Química e da Bio duas vezes.",
    porQueErrada: {
      B: "1/5 = 12/60 — é a probabilidade de resolver AS DUAS listas, não de não resolver nenhuma. Cuidado com a pergunta invertida.",
      C: "1/3 = 20/60. Esse valor não corresponde a nenhum conjunto do problema: provavelmente veio de 60 – (36 + 28) = –4… ou de chute.",
      D: "4/15 = 16/60 — resultado de quem esqueceu de subtrair a interseção (60 – 64 daria negativo) e improvisou o resto.",
    },
    dicaDeOuro:
      "n(A∪B) = n(A) + n(B) − n(A∩B). A UERJ AMA perguntar “nenhum dos dois”: some, subtraia a interseção, tire do total e SÓ ENTÃO divida. Leia a pergunta duas vezes — ela adora inverter.",
  },
  {
    id: "hum-cidadania-vargas",
    area: "humanas",
    tema: "Cidadania na Era Vargas",
    apoio: {
      texto:
        "Em 1943, a Consolidação das Leis do Trabalho (CLT) reuniu a legislação trabalhista: salário mínimo, férias, jornada de 8 horas. Os direitos, porém, eram vinculados ao emprego formal e ao enquadramento sindical — deixando de fora trabalhadores rurais e informais.",
      fonte: "Síntese historiográfica sobre a Era Vargas (elaborada no padrão UERJ).",
    },
    enunciado:
      "A historiografia denomina “cidadania regulada” o processo pelo qual, na Era Vargas:",
    alternativas: {
      A: "direitos sociais foram concedidos como prerrogativa do Estado, condicionados à integração formal do trabalhador e ao controle de sua autonomia.",
      B: "direitos políticos foram estendidos a todos os brasileiros, inclusive aos analfabetos.",
      C: "a legislação trabalhista foi elaborada por sindicatos autônomos em relação ao Estado.",
      D: "o Estado extinguiu a Justiça do Trabalho, liberando os contratos ao livre mercado.",
    },
    gabarito: "A",
    explicacaoCorreta:
      "No conceito de Wanderley Guilherme dos Santos, a cidadania brasileira foi “regulada”: os direitos vieram “de cima”, como concessão do Estado, atados à carteira assinada e a sindicatos atrelados ao Ministério do Trabalho (peleguismo). Trabalhador era cidadão enquanto formalmente integrado — autônomos, rurais e informais ficavam fora.",
    porQueErrada: {
      B: "Analfabetos só votaram no Brasil a partir de 1985 (EC 25). Na Era Vargas o voto era universal só “na teoria” — havia, inclusive, o DIP controlando a informação.",
      C: "É o oposto: a Lei Sindical de 1931 atrelou os sindicatos ao Estado (sindicato único, imposto sindical) — autonomia era exatamente o que não existia.",
      D: "Vargas CRIOU a Justiça do Trabalho (1939/1941), não a extinguiu. A alternativa inverte a história institucional do período.",
    },
    dicaDeOuro:
      "“Cidadania regulada” = direitos pela porta da carteira assinada + sindicatos tutelados pelo Estado. Pegadinha favorita: dizer que analfabetos votavam — NÃO votavam (só a partir de 1985).",
  },
  {
    id: "hum-segregacao-rj",
    area: "humanas",
    tema: "Segregação socioespacial no Rio",
    apoio: {
      texto:
        "No início do século XX, a reforma urbana do Rio de Janeiro (“bota-abaixo”) demoliu cortiços do centro para alargar avenidas e “sanear” a cidade. Sem política habitacional popular, parte da população removida ocupou morros e subúrbios distantes — padrão que marca a geografia carioca até hoje.",
      fonte: "Síntese da historiografia urbana carioca (elaborada no padrão UERJ).",
    },
    enunciado:
      "O processo descrito evidencia que, no Rio de Janeiro:",
    alternativas: {
      A: "a modernização urbana integrou as classes populares ao mercado formal de moradia, dissolvendo os cortiços.",
      B: "a remoção das habitações coletivas do centro empurrou a população pobre para áreas sem infraestrutura, aprofundando a segregação socioespacial.",
      C: "a favelização foi um fenômeno temporário, superado pelas políticas habitacionais da República Velha.",
      D: "o Estado promoveu a construção massiva de habitação popular no centro renovado.",
    },
    gabarito: "B",
    explicacaoCorreta:
      "A modernização foi excludente: o centro “higienizado” (Avenida Rio Branco, estilo Haussmann) expulsou os pobres sem lhes dar alternativa formal. O resultado foi a ocupação dos morros (o Morro da Favela/Providência, 1897, abrigou veteranos de Canudos e removidos) e dos subúrbios — nascia a cidade partida que o vestibular carioca adora discutir.",
    porQueErrada: {
      A: "Não houve integração: demoliu-se SEM reassentar. O mercado formal de moradia popular simplesmente não existia para essa população.",
      C: "A República Velha NÃO tinha política habitacional popular — e a favelização não só não foi “superada” como se expandiu por todo o século XX.",
      D: "O centro renovado foi ocupado por comércio e prédios de elite. Habitação popular no centro é agenda urbana do século XXI, não da Belle Époque carioca.",
    },
    dicaDeOuro:
      "A UERJ conecta o “bota-abaixo” de Pereira Passos com a ORIGEM das favelas (Morro da Providência, 1897) — e com a demolição do cortiço no romance de Aluísio Azevedo. Interdisciplinaridade na certa: leve Humanas + Literatura juntas.",
  },
];
