# -*- coding: utf-8 -*-
"""
=============================================================================
  RUMO AO CONCEITO A — Tutora Pessoal Inteligente · Medicina UERJ (2º EQ)
=============================================================================
  Aplicação web autossuficiente em UM ÚNICO arquivo (FastAPI + Uvicorn).

  INSTALAÇÃO:
      pip install fastapi uvicorn

  EXECUÇÃO:
      python app.py
      (o servidor sobe em http://0.0.0.0:8000 — abra no navegador)

  ENDPOINTS REST:
      GET  /                    → interface web (SPA em HTML/CSS/JS puro)
      GET  /api/next-question   → próxima questão não respondida (sem gabarito)
      POST /api/check-answer    → { "question_id": "...", "selected_option": "A" }
      GET  /api/reset           → reinicia a sessão de estudos
=============================================================================
"""

import random
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn

# ---------------------------------------------------------------------------
# BANCO DE QUESTÕES (padrão dos últimos 5 anos do 2º EQ da UERJ)
# ---------------------------------------------------------------------------

QUESTIONS: List[Dict] = [
    {
        "id": "lit-zoomorfizacao",
        "area": "Literatura · O Cortiço",
        "tema": "Zoomorfização do espaço",
        "apoio": "“Eram cinco horas da manhã e o cortiço acordava, abrindo, não os olhos, mas a sua infinidade de portas e janelas alinhadas. […] Sentia-se naquela fermentação sanguínea, naquela gula viçosa de plantas rasteiras que mergulham o pé vigoroso na lama preta e nutriente da vida, o prazer animal de existir, a triunfante satisfação de respirar sobre a terra.”",
        "fonte": "AZEVEDO, Aluísio. O Cortiço, 1890 (adaptado).",
        "enunciado": "No trecho, o narrador descreve o despertar da habitação coletiva valendo-se de um procedimento típico do Naturalismo, que consiste em:",
        "alt": {
            "A": "idealizar o espaço urbano como refúgio de harmonia entre as classes sociais.",
            "B": "conferir ao espaço atributos de organismo vivo, movido por impulsos quase animais.",
            "C": "denunciar, por meio de linguagem jornalística, as condições sanitárias das habitações.",
            "D": "apresentar o cotidiano dos moradores a partir de um ponto de vista confessional e subjetivo.",
        },
        "gab": "B",
        "certa": "O cortiço “acorda”, tem “gula”, sente “prazer animal de existir”: o narrador aplica ao prédio verbos e sensações de um ser vivo — a zoomorfização (ou zoantropização) do espaço. Essa é a assinatura estética de Aluísio Azevedo: o ambiente deixa de ser cenário e vira personagem, um organismo que engole e transforma quem vive nele.",
        "err": {
            "A": "A idealização harmoniosa é procedimento romântico — o oposto do Naturalismo, que expõe o conflito e a degradação sem maquiagem.",
            "C": "A linguagem aqui não é jornalística, e sim carregada de metáforas orgânicas. A denúncia naturalista se faz pela ciência do determinismo, não pelo tom de reportagem.",
            "D": "O narrador é onisciente e de pretensão objetiva/científica, em 3ª pessoa — não há confissão nem subjetivismo de personagem.",
        },
        "dica": "O cortiço É o protagonista. Sempre que a UERJ trouxer um trecho em que o prédio “sente”, “respira” ou “devora”, marque a alternativa que fala em organismo vivo/zoomorfização — é a questão mais recorrente sobre o livro.",
    },
    {
        "id": "lit-determinismo",
        "area": "Literatura · O Cortiço",
        "tema": "Determinismo do meio",
        "apoio": "Jerônimo, português trabalhador e sóbrio, vai aos poucos se “abrasileirando”: abandona a rotina disciplinada, apaixona-se por Rita Baiana, passa a beber cachaça e comete um crime por ela. O narrador atribui a metamorfose ao clima tropical, à convivência no cortiço e à sensualidade do ambiente.",
        "fonte": "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
        "enunciado": "A transformação de Jerônimo ao longo do romance ilustra qual princípio caro ao Naturalismo?",
        "alt": {
            "A": "A predestinação divina, que pune o imigrante por seu orgulho excessivo.",
            "B": "A hereditariedade, que desperta nele traços atávicos de sua família em Portugal.",
            "C": "O determinismo do meio, que molda o indivíduo conforme as circunstâncias que o cercam.",
            "D": "O livre-arbítrio do personagem, que escolhe conscientemente ascender na vida.",
        },
        "gab": "C",
        "certa": "O Naturalismo aplica ao romance a lógica das ciências: o homem é produto da raça, do meio e do momento (tese de Taine). Em Jerônimo, é o MEIO — o cortiço, o clima, a cultura popular carioca — que o modifica por inteiro. Ele não “escolhe” mudar; o ambiente o digere e o refaz.",
        "err": {
            "A": "Não há plano religioso no Naturalismo: a lente é científica, não moral ou divina. Castigo divino pertence a outra estética.",
            "B": "A hereditariedade também opera no livro (pense em Pombinha, filha de prostituta), mas o trecho aponta o meio como motor da mudança de Jerônimo.",
            "D": "O Naturalismo nega o livre-arbítrio: o personagem é resultado de forças que não controla. “Escolha consciente” é leitura liberal, não naturalista.",
        },
        "dica": "Naturalismo = “o homem é fruto do meio”. Se a questão mostra alguém MUDANDO por causa do cortiço, a resposta quase sempre envolve determinismo do meio. Macete da tríade: raça + meio + momento.",
    },
    {
        "id": "lit-joao-romao",
        "area": "Literatura · O Cortiço",
        "tema": "Ascensão de João Romão",
        "apoio": "João Romão começou com uma vendinha e um cortiço. Economia obsessiva, pequenos furtos de material de construção, exploração do trabalho de Bertoleza — mulher escravizada a quem fez crer que estava alforriada — e a expansão incessante das casinhas, até erguer sobradinhos e sonhar com o título de barão.",
        "fonte": "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
        "enunciado": "A trajetória de João Romão no romance corporifica:",
        "alt": {
            "A": "a crítica à acumulação primitiva de capital, feita à custa da exploração do trabalho alheio e do logro.",
            "B": "a defesa da mobilidade social alcançada exclusivamente pelo trabalho honesto do imigrante.",
            "C": "a condenação da industrialização nascente pelas elites agrárias do Segundo Reinado.",
            "D": "a apologia do self-made man como modelo do liberalismo tropical brasileiro.",
        },
        "gab": "A",
        "certa": "Aluísio Azevedo mostra a gênese do capital de Romão pelo avesso: roubo miúdo, usura e, sobretudo, a exploração do corpo e do trabalho de Bertoleza. A ascensão não é exemplar — é denunciada. O romance expõe que a fortuna “respeitável” do fim nasce da espoliação do início.",
        "err": {
            "B": "O romance faz o contrário de defender essa tese: mostra que o “trabalho” de Romão era feito de trapaça e exploração — a honestidade é fachada.",
            "C": "Romão é comerciante e senhor de cortiço urbano, não representante de elite agrária; a questão da industrialização não é o eixo da obra.",
            "D": "Não há apologia: o narrador expõe a brutalidade por trás do sucesso. “Self-made man” seria leitura ingênua que o texto desmonta.",
        },
        "dica": "Pergunta clássica: “a ascensão de João Romão representa…”. Fuja das alternativas elogiosas (mérito, honestidade, esforço). A banca quer a leitura crítica: exploração + acumulação primitiva.",
    },
    {
        "id": "lit-bertoleza",
        "area": "Literatura · O Cortiço",
        "tema": "A tragédia de Bertoleza",
        "apoio": "Bertoleza trabalha de sol a sol: lava, cozinha, carrega pedra para as construções de João Romão, que falsifica sua carta de alforria. Quando ele decide casar-se com Zulmira e tornar-se “capitalista”, os antigos donos a reclamam como escravizada — e ela tira a própria vida com uma facada no ventre.",
        "fonte": "Síntese do enredo de O Cortiço (AZEVEDO, 1890).",
        "enunciado": "O destino de Bertoleza funciona no romance como:",
        "alt": {
            "A": "um subplot romântico que suaviza a aspereza do enredo naturalista.",
            "B": "exposição dramática da estrutura escravista que persiste após a Abolição e sustenta a acumulação do senhor.",
            "C": "evidência da superioridade feminina na administração do cortiço.",
            "D": "crítica à recusa dos libertos em se integrarem ao trabalho assalariado.",
        },
        "gab": "B",
        "certa": "O romance é de 1890, dois anos após a Lei Áurea. Bertoleza é a população negra liberta traída pela Abolição sem reparação: sua “liberdade” era uma falsificação. O suicídio, no momento em que seria reescravizada, denuncia que a fortuna de Romão — e o “progresso” do Brasil — ergueu-se sobre esse corpo explorado até o fim.",
        "err": {
            "A": "Não há suavização: a morte de Bertoleza é o ponto mais brutal do livro, e o romance romântico é exatamente o que o Naturalismo combate.",
            "C": "Reduzir Bertoleza à “administração do cortiço” ignora sua condição de explorada — o foco é a violência da estrutura, não gestão doméstica.",
            "D": "A alternativa inverte a vítima em culpada: Bertoleza não recusa o trabalho; ela é roubada em sua liberdade. É a estrutura que a exclui.",
        },
        "dica": "Bertoleza = o custo humano da ascensão de Romão. A UERJ adora ligá-la ao contexto pós-Abolição (1888→1890): liberdade formal sem liberdade real. Grave essa data: o romance é de 1890.",
    },
    {
        "id": "lit-protagonista-coletivo",
        "area": "Literatura · O Cortiço",
        "tema": "Protagonista coletivo",
        "apoio": "A narrativa descreve a multidão de moradores como um formigueiro humano com ritmo próprio: acordam, brigam, amam e trabalham em fluxo contínuo, e as histórias individuais se diluem no movimento do conjunto. Ao mesmo tempo, o cortiço trava com o sobrado do Miranda uma rivalidade que organiza todo o espaço.",
        "fonte": "Síntese crítica de O Cortiço (AZEVEDO, 1890).",
        "enunciado": "A partir dessa organização narrativa, é correto concluir que, em O Cortiço:",
        "alt": {
            "A": "o protagonismo é do espaço coletivo, que condensa as tensões sociais do Rio de Janeiro do fim do Império.",
            "B": "a narração privilegia a profundidade psicológica da aristocracia do sobrado.",
            "C": "os conflitos sociais se resolvem pelo diálogo entre moradores e o barão.",
            "D": "a habitação coletiva é retratada como espaço harmônico, sem hierarquias internas.",
        },
        "gab": "A",
        "certa": "O Cortiço inaugura o protagonista coletivo na literatura brasileira: mais importante que qualquer indivíduo é o organismo-cortiço, com sua massa anônima e seus conflitos — cortiço (popular) × sobrado (elite), Brasil mestiço × Europa burguesa. As pessoas passam; o cortiço permanece e cresce.",
        "err": {
            "B": "O sobrado e o Miranda são coadjuvantes da rivalidade; o foco narrativo é o cortiço e sua gente miúda, não a psicologia da elite.",
            "C": "Não há conciliação: o romance é movido por brigas, incêndio e disputa de espaço. A tensão social nunca se resolve por diálogo.",
            "D": "O cortiço é profundamente hierarquizado: Romão no topo, moradores, sublocatários, e Bertoleza na base absoluta da pirâmide.",
        },
        "dica": "“Quem é o protagonista de O Cortiço?” — o próprio cortiço. Questão recorrente: protagonista coletivo + cortiço × sobrado como alegoria do Brasil. Decore esse par.",
    },
    {
        "id": "bio-glicemia",
        "area": "Biologia",
        "tema": "Homeostase glicêmica",
        "apoio": "Após um almoço rico em massas, a glicemia de uma estudante sobe de ~90 mg/dL para ~140 mg/dL. Duas horas depois, sem qualquer lanche intermediário, o valor já retornou ao patamar basal.",
        "fonte": "Situação-problema elaborada no padrão UERJ.",
        "enunciado": "Na fase de queda da glicemia, o hormônio predominante e seu principal efeito no fígado são, respectivamente:",
        "alt": {
            "A": "glucagon — estímulo da glicogenólise hepática.",
            "B": "insulina — estímulo da glicogênese e da captação de glicose pelas células.",
            "C": "glucagon — inibição da captação de glicose pelas células.",
            "D": "insulina — estímulo da gliconeogênese hepática.",
        },
        "gab": "B",
        "certa": "Hiperglicemia pós-refeição é detectada pelas células β das ilhotas pancreáticas, que secretam insulina. No fígado, a insulina ativa a glicogênese (glicose → glicogênio) e, nos músculos e tecido adiposo, promove a entrada de glicose via transportadores GLUT4. Resultado: a glicemia cai de volta ao set point.",
        "err": {
            "A": "Glucagon com glicogenólise é a resposta do JEJUM (hipoglicemia), não do pós-refeição. Inverteria o quadro: elevaria ainda mais a glicemia.",
            "C": "Além de o glucagon agir no jejum, seu efeito não é “inibir captação” — é liberar glicose hepática. E no pós-refeição quem reina é a insulina.",
            "D": "A gliconeogênese (fabricar glicose nova) é efeito do glucagon no jejum. A insulina faz o oposto: armazena, não produz glicose.",
        },
        "dica": "Dupla que a UERJ cobra todo ano: REFEIÇÃO = insulina (armazena: glicogênese); JEJUM = glucagon (libera: glicogenólise). Macete: “Insulina INTROduz glicose na célula”.",
    },
    {
        "id": "bio-magnificacao",
        "area": "Biologia",
        "tema": "Magnificação trófica",
        "apoio": "Em uma lagoa fluminense, mediu-se a concentração de um pesticida organoclorado não biodegradável: água, 0,00005 ppm; plâncton, 0,04 ppm; peixes pequenos, 0,5 ppm; peixes grandes, 2 ppm; aves piscívoras, 25 ppm.",
        "fonte": "Dados fictícios no padrão UERJ (baseados em estudos clássicos de DDT).",
        "enunciado": "Os dados ilustram o fenômeno da magnificação trófica, pois o contaminante:",
        "alt": {
            "A": "é diluído à medida que passa de um nível trófico para o seguinte.",
            "B": "concentra-se progressivamente nos organismos dos níveis tróficos mais altos.",
            "C": "é rapidamente metabolizado pelas aves, que por isso o acumulam.",
            "D": "é absorvido apenas pelos produtores, que o retêm integralmente.",
        },
        "gab": "B",
        "certa": "Organoclorados e metais pesados não são degradados nem excretados: acumulam-se nos tecidos (bioacumulação) e se CONCENTRAM a cada nível trófico, porque cada predador ingere muitas presas contaminadas (magnificação). Daí o salto de 0,00005 ppm na água para 25 ppm nas aves do topo — 500 mil vezes.",
        "err": {
            "A": "É o contrário da diluição: a concentração AUMENTA ao longo da cadeia. Se fosse diluída, as aves teriam o menor valor.",
            "C": "As aves acumulam justamente porque NÃO conseguem metabolizar o composto. Se o metabolizassem, ele seria eliminado, não acumulado.",
            "D": "O contaminante passa por TODOS os níveis — a tabela mostra isso. Os produtores apenas iniciam o processo de concentração.",
        },
        "dica": "Magnificação ≠ bioacumulação: magnificação é o AUMENTO ao longo da cadeia; a maior concentração está SEMPRE no predador de topo. Na UERJ, procure a ave/carnívoro no fim da teia.",
    },
    {
        "id": "bio-fermentacao",
        "area": "Biologia",
        "tema": "Respiração × fermentação láctica",
        "apoio": "No fim de um treino intenso de corrida, a musculatura de uma atleta começa a “queimar”. Nas fibras musculares em déficit de oxigênio, passa a predominar a degradação parcial da glicose com produção de lactato.",
        "fonte": "Situação-problema elaborada no padrão UERJ.",
        "enunciado": "Comparada à respiração celular aeróbia, a fermentação láctica fornece menos ATP porque:",
        "alt": {
            "A": "a glicose não é totalmente oxidada, e a etapa final do processo dispensa o oxigênio como aceptor de elétrons.",
            "B": "o lactato produzido consome a maior parte do ATP gerado na glicólise.",
            "C": "as mitocôndrias deixam de funcionar por falta de glicogênio muscular.",
            "D": "o processo só ocorre quando não há glicose disponível no sangue.",
        },
        "gab": "A",
        "certa": "Sem O₂ como aceptor final de elétrons, a cadeia respiratória (fosforilação oxidativa) para — e é ela que produz a maior parte do ATP (~26-28 dos 30-32 totais). Resta a glicólise, com saldo de 2 ATP e a redução do piruvato a lactato para regenerar NAD⁺. A glicose é degradada só parcialmente, daí o baixo rendimento.",
        "err": {
            "B": "O lactato não “consome ATP”: formar lactato a partir do piruvato apenas reoxida o NADH em NAD⁺, permitindo que a glicólise continue rendendo 2 ATP.",
            "C": "Glicogênio é a reserva de glicose muscular — e é justamente o que há disponível durante o esforço. O limitante é o O₂, não o substrato.",
            "D": "A fermentação ocorre COM glicose disponível; ela é ativada pelo déficit de oxigênio, não pela falta de glicose.",
        },
        "dica": "Números-chave: fermentação = 2 ATP; respiração aeróbia = 30-32 ATP. Se a UERJ perguntar “por que rende menos?”, a resposta mora na ausência de O₂ como aceptor final / oxidação incompleta.",
    },
    {
        "id": "qui-lechatelier",
        "area": "Química",
        "tema": "Princípio de Le Chatelier",
        "apoio": "Na síntese industrial da amônia (processo Haber-Bosch): N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g), ΔH = –92 kJ. O engenheiro do reator deseja aumentar o rendimento de NH₃ no equilíbrio.",
        "fonte": "Situação-problema elaborada no padrão UERJ.",
        "enunciado": "Dentre as alterações abaixo, a que aumenta o rendimento de amônia em equilíbrio é:",
        "alt": {
            "A": "elevar a temperatura do reator, mantendo a pressão constante.",
            "B": "adicionar um catalisador adequado ao sistema reacional.",
            "C": "aumentar a pressão total sobre o sistema.",
            "D": "remover continuamente N₂ do reator.",
        },
        "gab": "C",
        "certa": "Pelo Princípio de Le Chatelier, aumentar a pressão desloca o equilíbrio para o lado com MENOS mols gasosos: são 4 mols nos reagentes (1 N₂ + 3 H₂) e 2 mols nos produtos — logo, o equilíbrio vai para o NH₃. (Na indústria usa-se ~200 atm exatamente por isso.)",
        "err": {
            "A": "A reação é EXOTÉRMICA (ΔH < 0). Elevar a temperatura desloca o equilíbrio no sentido ENDOTÉRMICO — para os reagentes —, REDUZINDO o rendimento. (A indústria aquece por cinética, não por equilíbrio.)",
            "B": "Pegadinha clássica: catalisador acelera a chegada ao equilíbrio, mas NÃO desloca o equilíbrio nem altera o rendimento. Erra quem marca por intuição.",
            "D": "Remover um reagente desloca o equilíbrio para REPOr o reagente — ou seja, para a esquerda, consumindo NH₃ e diminuindo o rendimento.",
        },
        "dica": "Catalisador NUNCA desloca equilíbrio — a UERJ coloca essa alternativa em quase toda prova de equilíbrio químico. Pressão → lado com menos mols de gás; temperatura → sentido que ABSORVE o calor adicionado.",
    },
    {
        "id": "qui-funcoes",
        "area": "Química",
        "tema": "Funções orgânicas em fármacos",
        "apoio": "O ácido acetilsalicílico (AAS), analgésico e antiagregante plaquetário, possui um anel benzênico ligado a um grupo –COOH e a um grupo –O–CO–CH₃ (acetóxi).",
        "fonte": "Descrição estrutural elaborada no padrão UERJ.",
        "enunciado": "As funções orgânicas oxigenadas presentes na molécula do AAS são:",
        "alt": {
            "A": "ácido carboxílico e éster.",
            "B": "cetona e éter.",
            "C": "aldeído e amida.",
            "D": "álcool e ácido carboxílico.",
        },
        "gab": "A",
        "certa": "O grupo –COOH ligado ao anel é o ácido carboxílico (dá o “ácido” do nome). O grupo –O–CO–CH₃ é um éster: um oxigênio ponte ligado a um carbono de carbonila (–CO–O–). A molécula carrega as duas funções — por isso “ácido acetil-SALICÍLICO” é também um éster acetilado.",
        "err": {
            "B": "Não há C=O “solto” entre carbonos (cetona) nem oxigênio entre dois carbonos saturados sem carbonila (éter simples). O –O–CO– é éster, uma função própria.",
            "C": "Não há grupo –CHO (aldeído) nem nitrogênio na molécula — amida exige ligação C(=O)–N, ausente no AAS.",
            "D": "Ácido carboxílico está correto, mas não há –OH ligado a carbono saturado (álcool). O –OH do –COOH pertence à função ácida.",
        },
        "dica": "Viu oxigênio-ponte colado em C=O (–O–CO–)? É ÉSTER. A UERJ ama fármacos: AAS (ácido + éster), paracetamol (amida + fenol), salicilato de metila (éster). Leve esses três decorados.",
    },
    {
        "id": "qui-hess",
        "area": "Química",
        "tema": "Termoquímica · Lei de Hess",
        "apoio": "Combustão do carbono: C(s, grafite) + O₂(g) → CO₂(g), ΔH₁ = –394 kJ. Combustão do monóxido: CO(g) + ½ O₂(g) → CO₂(g), ΔH₂ = –283 kJ.",
        "fonte": "Dados termoquímicos elaborados no padrão UERJ.",
        "enunciado": "Pela Lei de Hess, a variação de entalpia da formação do monóxido de carbono, C(s) + ½ O₂(g) → CO(g), vale:",
        "alt": {
            "A": "–111 kJ",
            "B": "–677 kJ",
            "C": "+111 kJ",
            "D": "+677 kJ",
        },
        "gab": "A",
        "certa": "A formação do CO é a equação (1) menos a equação (2): mantemos (1) como está (C + O₂ → CO₂, –394) e invertemos (2) (CO₂ → CO + ½ O₂, +283). Somando, o CO₂ cancela e sobra C + ½ O₂ → CO, com ΔH = –394 + 283 = –111 kJ. Exotérmica, como toda combustão parcial de carbono.",
        "err": {
            "B": "–677 kJ resulta de SOMAR as duas entalpias (–394 – 283), esquecendo que a equação (2) precisa ser invertida — e inverter equação inverte o sinal.",
            "C": "+111 kJ acertaria o módulo, mas erraria o sinal: a formação do CO a partir de C e O₂ libera calor (exotérmica), não absorve.",
            "D": "+677 kJ soma os módulos com sinal trocado — dois erros combinados: não inverteu a equação e trocou o sinal do resultado.",
        },
        "dica": "Hess é álgebra de equações: inverteu → troca o sinal; multiplicou → multiplica o ΔH. Macete da formação do CO: ΔH(CO) = combustão do C − combustão do CO.",
    },
    {
        "id": "fis-chuveiro",
        "area": "Física & Matemática",
        "tema": "Eletrodinâmica · potência e kWh",
        "apoio": "Um chuveiro elétrico de 5.500 W é utilizado, em média, 30 minutos por dia, durante 30 dias. A tarifa de energia elétrica da residência é de R$ 0,90 por kWh.",
        "fonte": "Situação-problema elaborada no padrão UERJ.",
        "enunciado": "O consumo mensal de energia do chuveiro e o custo correspondente valem, respectivamente:",
        "alt": {
            "A": "82,5 kWh e R$ 74,25.",
            "B": "27,5 kWh e R$ 24,75.",
            "C": "165,0 kWh e R$ 148,50.",
            "D": "82,5 kWh e R$ 8,25.",
        },
        "gab": "A",
        "certa": "Converta antes de calcular: P = 5.500 W = 5,5 kW; t = 30 min = 0,5 h/dia. Energia diária = 5,5 × 0,5 = 2,75 kWh; em 30 dias, E = 2,75 × 30 = 82,5 kWh. Custo = 82,5 × R$ 0,90 = R$ 74,25. Repare que o chuveiro sozinho consome o que uma geladeira consome em dois meses.",
        "err": {
            "B": "27,5 kWh viria de usar 10 dias em vez de 30 (2,75 × 10). O consumo diário está certo; foi o número de dias que caiu.",
            "C": "165 kWh corresponde a 1 hora diária de banho (5,5 × 1 × 30). O enunciado fala em 30 minutos — metade disso.",
            "D": "O consumo está correto, mas R$ 8,25 usa tarifa de R$ 0,10/kWh. A conta certa é 82,5 × 0,90.",
        },
        "dica": "E(kWh) = P(kW) × t(h). Regra de ouro: converta W→kW e minutos→h ANTES de multiplicar, senão a banca te espera nas alternativas com vírgula no lugar errado.",
    },
    {
        "id": "mat-probabilidade",
        "area": "Física & Matemática",
        "tema": "Probabilidade com conjuntos",
        "apoio": "Em um cursinho pré-vestibular com 60 alunos, 36 resolvem as listas de Biologia, 28 resolvem as de Química e 12 resolvem as duas listas.",
        "fonte": "Situação-problema elaborada no padrão UERJ.",
        "enunciado": "Sorteando-se ao acaso um aluno desse grupo, a probabilidade de ele NÃO resolver nenhuma das duas listas é:",
        "alt": {
            "A": "2/15",
            "B": "1/5",
            "C": "1/3",
            "D": "4/15",
        },
        "gab": "A",
        "certa": "Pela fórmula da união: n(B ∪ Q) = 36 + 28 – 12 = 52 alunos resolvem ao menos uma lista. Logo, 60 – 52 = 8 não resolvem nenhuma. Probabilidade = 8/60 = 2/15 (≈ 13,3%). O “– 12” evita contar duas vezes quem resolve as duas listas.",
        "err": {
            "B": "1/5 = 12/60 — é a probabilidade de resolver AS DUAS listas, não de não resolver nenhuma. Cuidado com a pergunta invertida.",
            "C": "1/3 = 20/60. Esse valor não corresponde a nenhum conjunto do problema: provavelmente veio de um erro na união dos conjuntos.",
            "D": "4/15 = 16/60 — resultado de quem esqueceu de subtrair a interseção na fórmula da união e improvisou o resto.",
        },
        "dica": "n(A∪B) = n(A) + n(B) − n(A∩B). A UERJ AMA perguntar “nenhum dos dois”: some, subtraia a interseção, tire do total e SÓ ENTÃO divida. Leia a pergunta duas vezes — ela adora inverter.",
    },
    {
        "id": "hum-cidadania-vargas",
        "area": "Ciências Humanas",
        "tema": "Cidadania na Era Vargas",
        "apoio": "Em 1943, a Consolidação das Leis do Trabalho (CLT) reuniu a legislação trabalhista: salário mínimo, férias, jornada de 8 horas. Os direitos, porém, eram vinculados ao emprego formal e ao enquadramento sindical — deixando de fora trabalhadores rurais e informais.",
        "fonte": "Síntese historiográfica sobre a Era Vargas (padrão UERJ).",
        "enunciado": "A historiografia denomina “cidadania regulada” o processo pelo qual, na Era Vargas:",
        "alt": {
            "A": "direitos sociais foram concedidos como prerrogativa do Estado, condicionados à integração formal do trabalhador e ao controle de sua autonomia.",
            "B": "direitos políticos foram estendidos a todos os brasileiros, inclusive aos analfabetos.",
            "C": "a legislação trabalhista foi elaborada por sindicatos autônomos em relação ao Estado.",
            "D": "o Estado extinguiu a Justiça do Trabalho, liberando os contratos ao livre mercado.",
        },
        "gab": "A",
        "certa": "No conceito de Wanderley Guilherme dos Santos, a cidadania brasileira foi “regulada”: os direitos vieram “de cima”, como concessão do Estado, atados à carteira assinada e a sindicatos atrelados ao Ministério do Trabalho (peleguismo). Trabalhador era cidadão enquanto formalmente integrado — autônomos, rurais e informais ficavam fora.",
        "err": {
            "B": "Analfabetos só votaram no Brasil a partir de 1985 (EC 25). Na Era Vargas o sufrágio ainda excluía os analfabetos — pegadinha clássica.",
            "C": "É o oposto: a Lei Sindical de 1931 atrelou os sindicatos ao Estado (sindicato único, imposto sindical) — autonomia era exatamente o que não existia.",
            "D": "Vargas CRIOU a Justiça do Trabalho (1939/1941), não a extinguiu. A alternativa inverte a história institucional do período.",
        },
        "dica": "“Cidadania regulada” = direitos pela porta da carteira assinada + sindicatos tutelados pelo Estado. Pegadinha favorita: dizer que analfabetos votavam — NÃO votavam (só a partir de 1985).",
    },
    {
        "id": "hum-segregacao-rj",
        "area": "Ciências Humanas",
        "tema": "Segregação socioespacial no Rio",
        "apoio": "No início do século XX, a reforma urbana do Rio de Janeiro (“bota-abaixo”) demoliu cortiços do centro para alargar avenidas e “sanear” a cidade. Sem política habitacional popular, parte da população removida ocupou morros e subúrbios distantes — padrão que marca a geografia carioca até hoje.",
        "fonte": "Síntese da historiografia urbana carioca (padrão UERJ).",
        "enunciado": "O processo descrito evidencia que, no Rio de Janeiro:",
        "alt": {
            "A": "a modernização urbana integrou as classes populares ao mercado formal de moradia, dissolvendo os cortiços.",
            "B": "a remoção das habitações coletivas do centro empurrou a população pobre para áreas sem infraestrutura, aprofundando a segregação socioespacial.",
            "C": "a favelização foi um fenômeno temporário, superado pelas políticas habitacionais da República Velha.",
            "D": "o Estado promoveu a construção massiva de habitação popular no centro renovado.",
        },
        "gab": "B",
        "certa": "A modernização foi excludente: o centro “higienizado” (Avenida Rio Branco, estilo Haussmann) expulsou os pobres sem lhes dar alternativa formal. O resultado foi a ocupação dos morros (o Morro da Favela/Providência, 1897, abrigou veteranos de Canudos e removidos) e dos subúrbios — nascia a cidade partida que o vestibular carioca adora discutir.",
        "err": {
            "A": "Não houve integração: demoliu-se SEM reassentar. O mercado formal de moradia popular simplesmente não existia para essa população.",
            "C": "A República Velha NÃO tinha política habitacional popular — e a favelização não só não foi “superada” como se expandiu por todo o século XX.",
            "D": "O centro renovado foi ocupado por comércio e prédios de elite. Habitação popular no centro é agenda urbana do século XXI, não da Belle Époque carioca.",
        },
        "dica": "A UERJ conecta o “bota-abaixo” de Pereira Passos com a ORIGEM das favelas (Morro da Providência, 1897) — e com a demolição do cortiço no romance de Aluísio Azevedo. Interdisciplinaridade na certa: leve Humanas + Literatura juntas.",
    },
]

QUESTOES_POR_ID = {q["id"]: q for q in QUESTIONS}

# Metas oficiais trabalhadas no painel (2º EQ: 60 itens, Conceito A ≥ 70%)
META_ACERTOS = 43
TOTAL_ITENS = 60
ERROS_TOLERADOS = TOTAL_ITENS - META_ACERTOS  # 17

ELOGIOS = [
    "Isso! Mandou bem — esse raciocínio é exatamente o que a banca espera de quem vai vestir o jaleco.",
    "Acertou! E, melhor: acertou entendendo o porquê. É assim que se constrói um Conceito A.",
    "Excelente! A UERJ adora esse tipo de questão — e ela acabou de virar ponto garantido seu.",
    "Na mosca! Cada acerto assim te aproxima dos 20 pontos de bonificação na 2ª fase.",
    "Muito bom! Você leu a questão como a banca escreve — esse é o diferencial de quem passa em Medicina.",
]

ACOLHIMENTOS = [
    "Calma — errar aqui, agora, é o melhor lugar para errar. Cada deslize no treino vira um acerto no dia da prova.",
    "Sem neura: essa é exatamente o tipo de pegadinha que a banca monta. Agora que você viu por dentro, ela não te pega mais.",
    "Respira. Medicina é feita de persistência — e essa questão acabou de entrar no seu radar de revisão.",
    "Tudo bem! Errar no treino é diagnóstico, não sentença. Vamos entender juntas o que aconteceu?",
    "Olha pelo lado bom: você acabou de eliminar uma alternativa que não te engana duas vezes.",
]

# ---------------------------------------------------------------------------
# SESSÃO EM MEMÓRIA (usuária única local)
# ---------------------------------------------------------------------------

SESSAO = {"respostas": {}}  # {question_id: {"selected": "A", "correct": bool}}


def estatisticas() -> Dict:
    respostas = SESSAO["respostas"]
    total = len(respostas)
    acertos = sum(1 for r in respostas.values() if r["correct"])
    erros = total - acertos
    taxa = round((acertos / total) * 100, 1) if total else 0.0
    if taxa >= 70:
        conceito = "A"
    elif taxa >= 60:
        conceito = "B"
    elif taxa >= 50:
        conceito = "C"
    else:
        conceito = "D"
    return {
        "total_respondidas": total,
        "acertos": acertos,
        "erros": erros,
        "taxa_aproveitamento": taxa,
        "projecao_conceito": conceito,
        "margem_erros_restantes": max(0, ERROS_TOLERADOS - erros),
        "faltam_acertos_meta": max(0, META_ACERTOS - acertos),
        "meta_acertos": META_ACERTOS,
        "total_itens_prova": TOTAL_ITENS,
        "erros_tolerados": ERROS_TOLERADOS,
    }


# ---------------------------------------------------------------------------
# APLICAÇÃO FASTAPI
# ---------------------------------------------------------------------------

app = FastAPI(title="Tutora UERJ — Rumo ao Conceito A", version="1.0.0")


class CheckAnswer(BaseModel):
    question_id: str
    selected_option: str


@app.get("/api/next-question")
def next_question():
    """Retorna a próxima questão não respondida, SEM expor o gabarito."""
    for q in QUESTIONS:
        if q["id"] not in SESSAO["respostas"]:
            return {
                "done": False,
                "question": {
                    "id": q["id"],
                    "area": q["area"],
                    "tema": q["tema"],
                    "apoio": q["apoio"],
                    "fonte": q["fonte"],
                    "enunciado": q["enunciado"],
                    "alternativas": q["alt"],
                },
                "estatisticas_aluna": estatisticas(),
            }
    return {"done": True, "question": None, "estatisticas_aluna": estatisticas()}


@app.post("/api/check-answer")
def check_answer(payload: CheckAnswer):
    """Valida o acerto, atualiza o histórico e devolve a correção pedagógica."""
    q = QUESTOES_POR_ID.get(payload.question_id)
    if q is None:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    opcao = payload.selected_option.strip().upper()
    if opcao not in ("A", "B", "C", "D"):
        raise HTTPException(status_code=400, detail="Opção inválida. Use A, B, C ou D.")
    if payload.question_id in SESSAO["respostas"]:
        raise HTTPException(status_code=409, detail="Questão já respondida nesta sessão.")

    correta = opcao == q["gab"]
    mensagem = random.choice(ELOGIOS) if correta else random.choice(ACOLHIMENTOS)
    SESSAO["respostas"][payload.question_id] = {"selected": opcao, "correct": correta}

    return {
        "is_correct": correta,
        "gabarito": q["gab"],
        "mensagem_tutor": mensagem,
        "explicacao_didatica": q["certa"],
        "por_que_escolhida_errada": None if correta else q["err"].get(opcao),
        "dica_de_ouro_uerj": q["dica"],
        "estatisticas_aluna": estatisticas(),
    }


@app.get("/api/reset")
def reset():
    """Reinicia a sessão de estudos."""
    SESSAO["respostas"] = {}
    return {"status": "ok", "mensagem": "Sessão reiniciada. Bora de novo, futura médica!", "estatisticas_aluna": estatisticas()}


@app.get("/", response_class=HTMLResponse)
def index():
    return INDEX_HTML


# ---------------------------------------------------------------------------
# INTERFACE WEB (SPA em HTML/CSS/JS puro, servida em /)
# ---------------------------------------------------------------------------

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rumo ao Conceito A · Tutora UERJ — Medicina 2º EQ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0c1014; --panel:#141b22; --panel2:#182029; --border:#223041; --border2:#2e4055;
  --txt:#e7edf4; --mut:#8a9bb0; --dim:#5d7189;
  --red:#e03a48; --red-soft:#b93041; --blue:#5b8def; --emer:#2fbf8f; --emer-deep:#1f9c74; --gold:#e8b54d;
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font-family:'Instrument Sans',sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh}
.mono{font-family:'JetBrains Mono',monospace}
.display{font-family:'Sora',sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
/* fundo ambiente */
body::before{content:"";position:fixed;inset:0;z-index:-2;background:
  radial-gradient(700px 380px at 12% -6%,rgba(224,58,72,.13),transparent 60%),
  radial-gradient(760px 420px at 88% 8%,rgba(91,141,239,.10),transparent 60%),
  radial-gradient(700px 500px at 50% 115%,rgba(47,191,143,.07),transparent 60%),var(--bg)}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background-image:linear-gradient(rgba(91,141,239,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(91,141,239,.05) 1px,transparent 1px);
  background-size:44px 44px;mask-image:radial-gradient(ellipse 90% 70% at 50% 0%,black 30%,transparent 78%)}
/* header */
header{position:sticky;top:0;z-index:40;border-bottom:1px solid rgba(34,48,65,.8);background:rgba(16,21,27,.85);backdrop-filter:blur(10px)}
.hrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.brand-badge{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(224,58,72,.14);border:1px solid rgba(224,58,72,.5);position:relative;flex-shrink:0}
.brand-badge svg{width:24px;height:24px;color:var(--red)}
.brand-badge i{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:var(--emer);border:2px solid var(--bg);animation:pulse 1.6s ease-in-out infinite}
.brand h1{font-size:16px;font-weight:800;letter-spacing:-.01em}
.brand h1 em{color:var(--emer);font-style:normal}
.brand p{font-size:11px;color:var(--mut)}
.hbtns{display:flex;align-items:center;gap:10px;flex-shrink:0}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);background:var(--panel);border-radius:10px;padding:8px 12px}
.chip .mono{font-weight:700;font-size:14px}
.chip svg{width:16px;height:16px;color:var(--gold)}
button{font-family:inherit;cursor:pointer}
.btn{border:1px solid var(--border);background:var(--panel);color:var(--mut);border-radius:10px;padding:8px 13px;font-size:12px;font-weight:600;transition:all .25s}
.btn:hover{color:var(--red);border-color:rgba(224,58,72,.6)}
/* layout */
main{display:grid;grid-template-columns:330px 1fr;gap:24px;padding:28px 0 60px;align-items:start}
@media(max-width:900px){main{grid-template-columns:1fr}}
.card{border:1px solid var(--border);background:var(--panel);border-radius:14px;overflow:hidden}
.card+.card{margin-top:16px}
.card-h{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.card-h h2{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
.card-b{padding:20px}
/* gauge */
.gauge-num{font-family:'Sora';font-weight:800;font-size:30px;fill:var(--txt)}
.gauge-sub{font-family:'JetBrains Mono';font-size:11px;fill:var(--mut)}
.mini3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.mini{border:1px solid var(--border);background:var(--panel2);border-radius:10px;padding:10px 6px;text-align:center}
.mini b{display:block;font-family:'JetBrains Mono';font-size:20px;line-height:1}
.mini span{display:block;font-size:9.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--mut);margin-top:5px}
.taxa-row{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);background:var(--panel2);border-radius:10px;padding:10px 14px;margin-top:12px}
.taxa-row .lbl{font-size:9.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--mut)}
.taxa-row b{font-family:'JetBrains Mono';font-size:18px}
.conc{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Sora';font-weight:800;font-size:20px;transition:all .4s}
/* margem */
.blocks{display:flex;gap:3px;margin-top:8px}
.blocks i{height:10px;flex:1;border-radius:3px;transition:all .5s}
.leg{font-size:11px;color:var(--dim);line-height:1.6;margin-top:10px}
.leg b{color:var(--mut)}
.nota{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(47,191,143,.3);background:rgba(47,191,143,.07);border-radius:10px;padding:10px 12px;margin-top:14px;font-size:12px;line-height:1.5}
.nota svg{width:16px;height:16px;color:var(--emer);flex-shrink:0;margin-top:2px}
.nota b{color:var(--emer)}
/* questão */
.qchip{display:inline-flex;align-items:center;gap:8px;border-radius:8px;padding:5px 11px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.qchip i{width:6px;height:6px;border-radius:50%;animation:pulse 1.6s infinite}
.apoio{border-left:3px solid var(--border2);background:rgba(24,32,41,.7);border-radius:0 10px 10px 0;padding:13px 16px;font-size:13.5px;font-style:italic;color:#b9c6d6;line-height:1.65;margin-bottom:16px}
.apoio footer{margin-top:8px;font-size:11px;font-style:normal;font-family:'JetBrains Mono';color:var(--dim)}
.enun{font-family:'Sora';font-weight:600;font-size:15.5px;line-height:1.65;margin-bottom:20px}
.opt{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;border:1px solid var(--border);background:var(--panel2);border-radius:11px;padding:12px 15px;color:#b9c6d6;font-size:14px;line-height:1.6;transition:all .25s;margin-bottom:10px}
.opt:not(:disabled):hover{border-color:rgba(47,191,143,.6);background:rgba(47,191,143,.06);transform:translateX(5px)}
.opt:disabled{cursor:default}
.opt .lt{flex-shrink:0;width:28px;height:28px;border-radius:8px;background:var(--border);display:flex;align-items:center;justify-content:center;font-family:'Sora';font-weight:700;font-size:13px;margin-top:1px;transition:all .25s}
.opt.ok{border-color:rgba(47,191,143,.7);background:rgba(47,191,143,.13);box-shadow:0 0 0 1px rgba(47,191,143,.35)}
.opt.ok .lt{background:var(--emer);color:var(--bg)}
.opt.ko{border-color:rgba(185,48,65,.7);background:rgba(185,48,65,.14);animation:shake .45s}
.opt.ko .lt{background:var(--red-soft);color:#fff}
.opt.fade{opacity:.4}
.badge-ok,.badge-ko{margin-left:auto;flex-shrink:0;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:pop .35s cubic-bezier(.34,1.56,.64,1)}
.badge-ok{background:var(--emer);color:var(--bg)}
.badge-ko{background:var(--red);color:#fff}
/* feedback */
.fb{border-top:1px solid var(--border);background:rgba(12,16,20,.6);padding:20px;display:none;animation:rise .5s cubic-bezier(.22,1,.36,1)}
.fb.show{display:block}
.fb-head{display:flex;gap:12px;margin-bottom:16px}
.fb-ava{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.fb-ava svg{width:20px;height:20px}
.fb-k{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;margin-bottom:3px}
.fb-q{font-size:14px;line-height:1.6;font-style:italic}
.fb-box{border:1px solid var(--border);background:var(--panel);border-radius:10px;padding:16px;margin-bottom:14px}
.fb-box h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:9px}
.fb-box p{font-size:13.5px;line-height:1.7;color:#b9c6d6}
.fb-box h4+h4,.fb-box p+h4{margin-top:16px}
.dica{position:relative;border:1px solid rgba(232,181,77,.4);background:linear-gradient(135deg,rgba(232,181,77,.12),rgba(232,181,77,.04));border-radius:10px;padding:14px 16px;margin-bottom:14px;overflow:hidden}
.dica h4{color:var(--gold);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:7px;display:flex;align-items:center;gap:6px}
.dica p{font-size:13.5px;line-height:1.7}
.dica svg.starbg{position:absolute;right:-8px;top:-8px;width:48px;height:48px;color:rgba(232,181,77,.15);transform:rotate(12deg)}
.stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
@media(max-width:640px){.stats4{grid-template-columns:repeat(2,1fr)}}
.nextbtn{display:inline-flex;align-items:center;gap:10px;background:var(--emer);color:var(--bg);border:none;border-radius:11px;padding:13px 24px;font-family:'Sora';font-weight:700;font-size:14px;transition:all .25s}
.nextbtn:hover{background:var(--emer-deep);box-shadow:0 6px 24px rgba(47,191,143,.35)}
.nextbtn svg{width:17px;height:17px;transition:transform .25s}
.nextbtn:hover svg{transform:translateX(4px)}
/* fim */
.end-h{padding:22px 24px;border-bottom:1px solid var(--border)}
.end-h .k{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:var(--gold);margin-bottom:6px}
.end-h h2{font-family:'Sora';font-weight:800;font-size:26px}
.end-h p{margin-top:8px;font-size:13.5px;color:var(--mut);font-style:italic}
.erritem{border:1px solid rgba(185,48,65,.4);background:rgba(185,48,65,.07);border-radius:10px;padding:11px 14px;margin-bottom:8px}
.erritem .t{display:flex;justify-content:space-between;gap:8px;font-size:11px;margin-bottom:4px}
.erritem .t b{text-transform:uppercase;letter-spacing:.06em}
.erritem .t span{font-family:'JetBrains Mono';color:var(--dim)}
.erritem p{font-size:12.5px;color:#b9c6d6}
.rowbtns{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.anim-up{animation:rise .55s cubic-bezier(.22,1,.36,1) both}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.45);opacity:.55}}
@keyframes pop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
</style>
</head>
<body>
<header>
  <div class="wrap hrow">
    <div class="brand">
      <span class="brand-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5S3.5 15.5 3.5 9.2C3.5 6.3 5.7 4.5 8 4.5c1.8 0 3.3 1 4 2.4.7-1.4 2.2-2.4 4-2.4 2.3 0 4.5 1.8 4.5 4.7 0 6.3-8.5 11.3-8.5 11.3Z"/><path d="M5 12h3l1.5-3 2.5 5.5L13.5 12H19"/></svg>
        <i></i>
      </span>
      <div>
        <h1 class="display">Rumo ao Conceito <em>A</em></h1>
        <p>Tutora pessoal · Medicina UERJ · 2º Exame de Qualificação</p>
      </div>
    </div>
    <div class="hbtns">
      <span class="chip" title="Cronômetro da sessão">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l3 2M9.5 2.5h5M12 2.5V6"/></svg>
        <span class="mono" id="timer">00:00</span>
      </span>
      <button class="btn" id="btnReset">↺ Reiniciar</button>
    </div>
  </div>
</header>

<main class="wrap">
  <!-- TERMÔMETRO -->
  <aside>
    <section class="card">
      <div class="card-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2fbf8f" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="#2fbf8f"/></svg><h2 style="color:var(--txt)">Termômetro do Conceito A</h2></div>
      <div class="card-b">
        <p style="font-size:11px;color:var(--dim);line-height:1.6;margin-bottom:6px">Meta: <b style="color:var(--mut)">43 acertos (≥ 70% de 60)</b> = bonificação máxima de <b style="color:var(--emer)">+20 pts</b> na 2ª fase de Medicina.</p>
        <svg viewBox="0 0 190 108" style="width:100%;max-width:250px;display:block;margin:0 auto">
          <path d="M 21 100 A 74 74 0 0 1 169 100" fill="none" stroke="#223041" stroke-width="13" stroke-linecap="round"/>
          <path id="gaugeFill" d="M 21 100 A 74 74 0 0 1 169 100" fill="none" stroke="url(#g)" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 233" style="transition:stroke-dasharray .9s cubic-bezier(.22,1,.36,1)"/>
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1f9c74"/><stop offset="100%" stop-color="#2fbf8f"/></linearGradient></defs>
          <text x="95" y="72" text-anchor="middle" class="gauge-num" id="gAcertos">0</text>
          <text x="95" y="92" text-anchor="middle" class="gauge-sub">de 43 p/ a meta</text>
        </svg>
        <div class="mini3">
          <div class="mini"><b style="color:#b9c6d6" id="mResp">0</b><span>Respondidas</span></div>
          <div class="mini"><b style="color:var(--emer)" id="mAc">0</b><span>Acertos</span></div>
          <div class="mini"><b style="color:var(--red)" id="mEr">0</b><span>Erros</span></div>
        </div>
        <div class="taxa-row">
          <div><div class="lbl">Aproveitamento</div><b id="mTaxa">—</b></div>
          <div style="text-align:right"><div class="lbl">Projeção</div><div class="conc" id="mConc" style="color:#5b8def;background:rgba(91,141,239,.12);border:1px solid rgba(91,141,239,.4)">—</div></div>
        </div>
      </div>
    </section>
    <section class="card">
      <div class="card-b">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--mut)">Margem de erros restantes</span><b class="mono" id="mMargem" style="color:var(--emer)">17/17</b></div>
        <div class="blocks" id="blocks"></div>
        <p class="leg">No 2º EQ (60 itens), o Conceito A admite no máximo <b>17 erros</b>. Cada bloco vermelho é um erro gasto.</p>
        <div class="nota" id="notaMeta" style="display:none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 21V4"/><path d="M5 4c4-2.2 7 2.2 11 0v9c-4 2.2-7-2.2-11 0"/></svg>
          <span>Faltam <b id="nFaltam">43</b> acertos para cravar a meta. Mantendo o ritmo, você chega lá.</span>
        </div>
      </div>
    </section>
  </aside>

  <!-- ÁREA DA QUESTÃO -->
  <div id="stage"></div>
</main>

<script>
const CORES = {"Literatura · O Cortiço":"#e03a48","Biologia":"#2fbf8f","Química":"#5b8def","Física & Matemática":"#e8b54d","Ciências Humanas":"#3fb6ae"};
const CORES_C = {"A":"#2fbf8f","B":"#5b8def","C":"#e8b54d","D":"#e03a48"};
let atual = null, respondida = false, segundos = 0;

function fmt(s){const h=Math.floor(s/3600),m=String(Math.floor((s%3600)/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');return h>0?h+':'+m+':'+ss:m+':'+ss;}
setInterval(()=>{segundos++;document.getElementById('timer').textContent=fmt(segundos);},1000);

function pintaStats(e){
  const CIRC=232.5, pct=Math.min(1,e.acertos/e.meta_acertos);
  document.getElementById('gaugeFill').setAttribute('stroke-dasharray',(CIRC*pct)+' '+CIRC);
  document.getElementById('gAcertos').textContent=e.acertos;
  document.getElementById('mResp').textContent=e.total_respondidas;
  document.getElementById('mAc').textContent=e.acertos;
  document.getElementById('mEr').textContent=e.erros;
  document.getElementById('mTaxa').textContent=e.total_respondidas?e.taxa_aproveitamento.toFixed(1)+'%':'—';
  const c=document.getElementById('mConc');
  c.textContent=e.total_respondidas?e.projecao_conceito:'—';
  const cor=CORES_C[e.projecao_conceito]||'#5b8def';
  c.style.color=cor;c.style.background=cor+'1f';c.style.border='1px solid '+cor+'55';
  const marg=document.getElementById('mMargem');
  marg.textContent=e.margem_erros_restantes+'/'+e.erros_tolerados;
  marg.style.color=e.erros>12?'#e03a48':e.erros>8?'#e8b54d':'#2fbf8f';
  const bl=document.getElementById('blocks');bl.innerHTML='';
  for(let i=0;i<e.erros_tolerados;i++){const b=document.createElement('i');const usado=i<e.erros;
    b.style.background=usado?'#b93041':'#1f9c74';b.style.opacity=usado?0.9:(0.5+0.5*i/e.erros_tolerados);bl.appendChild(b);}
  const nota=document.getElementById('notaMeta');
  if(e.total_respondidas>0&&e.faltam_acertos_meta>0){nota.style.display='flex';document.getElementById('nFaltam').textContent=e.faltam_acertos_meta;}
  else nota.style.display='none';
}

function telaQuestao(q,e){
  atual=q;respondida=false;
  const cor=CORES[q.area]||'#5b8def';
  let opts='';
  ['A','B','C','D'].forEach(L=>{opts+='<button class="opt" data-l="'+L+'"><span class="lt">'+L+'</span><span>'+q.alternativas[L]+'</span><span class="badge"></span></button>';});
  document.getElementById('stage').innerHTML=
   '<article class="card anim-up">'+
   '<div class="card-h" style="background:linear-gradient(90deg,'+cor+'24,transparent 65%)">'+
     '<span class="qchip" style="color:'+cor+';background:'+cor+'24;border:1px solid '+cor+'44"><i style="background:'+cor+'"></i>'+q.area+'</span>'+
     '<span class="mono" style="font-size:11px;color:var(--dim);margin-left:auto">'+q.tema+'</span>'+
   '</div>'+
   '<div class="card-b">'+
     (q.apoio?'<blockquote class="apoio" style="border-color:'+cor+'">'+q.apoio+'<footer>— '+q.fonte+'</footer></blockquote>':'')+
     '<h2 class="enun">'+q.enunciado+'</h2>'+
     '<div id="opts">'+opts+'</div>'+
   '</div>'+
   '<div class="fb" id="fb"></div>'+
   '</article>';
  document.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>responder(b.dataset.l)));
}

async function responder(letra){
  if(respondida||!atual)return;
  respondida=true;
  const r=await fetch('/api/check-answer',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question_id:atual.id,selected_option:letra})}).then(r=>r.json());
  const cor=CORES[atual.area]||'#5b8def';
  document.querySelectorAll('.opt').forEach(b=>{
    const L=b.dataset.l,badge=b.querySelector('.badge');
    b.disabled=true;
    if(L===r.gabarito){b.classList.add('ok');b.querySelector('.lt').textContent='✓';
      badge.className='badge-ok';badge.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m4.5 12.5 5 5 10-11"/></svg>';}
    else if(L===letra){b.classList.add('ko');b.querySelector('.lt').textContent='✕';
      badge.className='badge-ko';badge.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';}
    else b.classList.add('fade');
  });
  const e=r.estatisticas_aluna;pintaStats(e);
  const fb=document.getElementById('fb');
  fb.innerHTML=
   '<div class="fb-head">'+
     '<span class="fb-ava" style="background:'+(r.is_correct?'rgba(47,191,143,.15)':'rgba(224,58,72,.14)')+';border:1px solid '+(r.is_correct?'rgba(47,191,143,.45)':'rgba(224,58,72,.4)')+'">'+
       '<svg viewBox="0 0 24 24" fill="none" stroke="'+(r.is_correct?'#2fbf8f':'#e03a48')+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5S3.5 15.5 3.5 9.2C3.5 6.3 5.7 4.5 8 4.5c1.8 0 3.3 1 4 2.4.7-1.4 2.2-2.4 4-2.4 2.3 0 4.5 1.8 4.5 4.7 0 6.3-8.5 11.3-8.5 11.3Z"/><path d="M5 12h3l1.5-3 2.5 5.5L13.5 12H19"/></svg></span>'+
     '<div><div class="fb-k" style="color:'+(r.is_correct?'#2fbf8f':'#e03a48')+'">'+(r.is_correct?'Acertou!':'Não foi dessa vez')+'</div>'+
     '<p class="fb-q">“'+r.mensagem_tutor+'”</p></div>'+
   '</div>'+
   '<div class="fb-box"><h4 style="color:var(--blue)">Por que a '+r.gabarito+' é a correta</h4><p>'+r.explicacao_didatica+'</p>'+
     (r.por_que_escolhida_errada?'<h4 style="color:var(--red)">Por que a sua ('+letra+') não fecha</h4><p>'+r.por_que_escolhida_errada+'</p>':'')+
   '</div>'+
   '<div class="dica"><svg class="starbg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.7 5.9 6.3.7-4.7 4.3 1.3 6.2L12 16.5l-5.6 3.2 1.3-6.2L3 9.2l6.3-.7L12 2.6Z"/></svg>'+
     '<h4>★ Dica de ouro · estilo UERJ</h4><p>'+r.dica_de_ouro_uerj+'</p></div>'+
   '<div class="stats4">'+
     '<div class="mini"><b style="color:#b9c6d6">'+e.total_respondidas+'</b><span>Respondidas</span></div>'+
     '<div class="mini"><b style="color:var(--blue)">'+e.taxa_aproveitamento.toFixed(1)+'%</b><span>Aproveit.</span></div>'+
     '<div class="mini"><b style="color:var(--emer)">'+e.projecao_conceito+'</b><span>Conceito</span></div>'+
     '<div class="mini"><b style="color:var(--gold)">'+e.margem_erros_restantes+'</b><span>Erros rest.</span></div>'+
   '</div>'+
   '<button class="nextbtn" id="btnNext">Próxima questão <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg></button>';
  fb.classList.add('show');
  fb.scrollIntoView({behavior:'smooth',block:'nearest'});
  document.getElementById('btnNext').addEventListener('click',carregar);
}

function telaFim(e){
  const cor=CORES_C[e.projecao_conceito];
  const msg=e.projecao_conceito==='A'
    ?'“É esse aproveitamento que separa quem SONHA com Medicina de quem ASSINA a lista de aprovados. Orgulho define.”'
    :'“Todo Conceito A começou exatamente aqui: errando no treino e entendendo o porquê. Bora de novo?”';
  document.getElementById('stage').innerHTML=
   '<section class="card anim-up"><div class="end-h" style="background:linear-gradient(90deg,'+cor+'24,transparent 70%)">'+
   '<div class="k" style="display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4c4-2.2 7 2.2 11 0v9c-4 2.2-7-2.2-11 0"/></svg> Simulado concluído</div><h2>Resultado da rodada · <span style="color:'+cor+'">Conceito '+e.projecao_conceito+'</span></h2>'+
   '<p>'+msg+'</p></div>'+
   '<div class="card-b">'+
   '<div class="stats4"><div class="mini"><b style="color:var(--emer)">'+e.acertos+'</b><span>Acertos</span></div>'+
   '<div class="mini"><b style="color:var(--blue)">'+e.taxa_aproveitamento.toFixed(1)+'%</b><span>Aproveit.</span></div>'+
   '<div class="mini"><b style="color:var(--gold)">'+fmt(segundos)+'</b><span>Tempo</span></div>'+
   '<div class="mini"><b style="color:var(--red)">'+e.erros+'/'+e.erros_tolerados+'</b><span>Margem usada</span></div></div>'+
   '<div class="rowbtns"><button class="nextbtn" id="btnNovo">↺ Reiniciar simulado</button></div>'+
   '</div></section>';
  document.getElementById('btnNovo').addEventListener('click',resetar);
}

async function carregar(){
  const d=await fetch('/api/next-question').then(r=>r.json());
  pintaStats(d.estatisticas_aluna);
  if(d.done)telaFim(d.estatisticas_aluna);else telaQuestao(d.question,d.estatisticas_aluna);
}

async function resetar(){
  if(!confirm('Reiniciar a sessão? Todo o histórico (acertos, erros e cronômetro) será apagado.'))return;
  segundos=0;document.getElementById('timer').textContent='00:00';
  await fetch('/api/reset');carregar();window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('btnReset').addEventListener('click',resetar);

// margem inicial (17 blocos)
(function(){const bl=document.getElementById('blocks');for(let i=0;i<17;i++){const b=document.createElement('i');b.style.background='#1f9c74';b.style.opacity=0.5+0.5*i/17;bl.appendChild(b);}})();

carregar();
</script>
</body>
</html>
"""

# ---------------------------------------------------------------------------
# EXECUÇÃO
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 62)
    print("  RUMO AO CONCEITO A — Tutora UERJ (Medicina · 2º EQ)")
    print("  Abra no navegador:  http://localhost:8000")
    print("=" * 62)
    uvicorn.run(app, host="0.0.0.0", port=8000)
