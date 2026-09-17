# 🎯 Rumo ao Conceito A - Tutor UERJ

Sistema completo de preparação para o vestibular da UERJ, com foco em Medicina.

## 🆕 Novidades

### 👥 Sistema de Perfis com Login

**Multiusuário completo!** Cada vestibulanda tem seu próprio espaço com progresso isolado:

- **Jujuba** 🌸 - Perfil principal (vermelho/rosa)
- **Amigas da Jujuba** 👯 - Perfil compartilhado (azul)
- **Progresso separado** - Cada perfil tem suas próprias estatísticas, caderno de erros e histórico
- **Login visual** - Tela de seleção de perfil com cards animados
- **Badge de perfil** - Indicador visual no header com opção de trocar de perfil
- **Persistência** - Dados salvos automaticamente no localStorage por perfil

### 🎨 Background Meditativo Aprimorado

**Fundo mais moderno e animado** com efeitos visuais de clareza:

- **Mandalas sagradas** girando lentamente (120-200s por rotação)
- **Orbes de luz** (glow orbs) pulsando suavemente em 5 posições
- **Folhas maiores e mais visíveis** (55-65px) com drop-shadow
- **Partículas de vento** com glow effect (tamanho 4-6px com box-shadow)
- **Linhas de brisa** mais espessas (2px) com glow
- **Paleta verde e marrom** transmitindo natureza e tradição

### 📝 Simulado Discursivo com IA (3ª Fase)

**Nova funcionalidade completa!** 10 questões discursivas no padrão exato da 3ª fase da UERJ para Medicina:

- **5 questões de Biologia** (Fisiologia, Genética, Ecologia, Citologia, Imunologia)
- **5 questões de Química** (Cinética, Equilíbrio, Orgânica, Termoquímica, Eletroquímica)
- **Correção automática por IA** com análise detalhada
- **Nota de 0 a 100%** baseada em critérios de correção reais da UERJ
- **Feedback estruturado**: critérios atingidos, pontos fortes, pontos a melhorar
- **Gabarito comentado** com explicação completa
- **Dicas de ouro** específicas para cada questão

### 🎨 Nova Identidade Visual

Paleta de cores renovada em **verde e marrom**, transmitindo:
- 🌿 Verde: crescimento, aprovação, natureza (Biologia)
- 🪵 Marrom: solidez, conhecimento, tradição (Química)

### 🕊️ Background de Paz e Tranquilidade

**Novo fundo meditativo** criado especialmente para a vestibulanda assimilar calma antes da prova:

- **Mandalas sagradas** girando lentamente (rotação de 120-180 segundos)
- **Folhas flutuando** ao vento com trajetórias variadas
- **Partículas de brisa** se movendo suavemente pela tela
- **Linhas ondulantes** simulando o fluxo do vento
- **Paleta de cores suaves**: verde musgo, marrom terra, dourado suave

O background foi projetado para ser **sutil e não invasivo**, permitindo total foco no conteúdo enquanto transmite uma sensação de paz e acolhimento. É um lembrete visual de que ela estudou muito e está preparada.

**Mensagem de acolhimento** no topo da Landing Page:
> ✨ Respire fundo. Você estudou muito. Está no caminho certo.

## 📋 Funcionalidades

### 1. Landing Page (`/`)
- Dashboard com estatísticas em tempo real
- Acesso rápido a todos os simulados
- Termômetro do Conceito A (meta: 43 acertos)

### 2. Simulado Objetivo (`/prova`)
- 15 questões objetivas (múltipla escolha)
- Feedback imediato após cada resposta
- Explicações detalhadas
- Cronômetro e controle de tempo

### 3. Simulado Discursivo (`/discursivas`) ⭐ NOVO
- 10 questões discursivas (5 Biologia + 5 Química)
- Correção automática por IA
- Análise de critérios de correção
- Nota percentual e conceito (A-E)
- Gabarito completo com explicação

### 4. Upload de Provas (`/enviar`)
- Envio de PDFs e imagens
- Extração automática de questões
- Adição ao banco de questões

### 5. Caderno de Erros (`/caderno`)
- Registro automático de erros
- Revisão espaçada
- Estatísticas por matéria
- Foco nos pontos fracos

## 🚀 Como Usar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎯 Padrões UERJ Identificados

### Biologia (3ª Fase)
1. **Fisiologia Humana** - Homeostase, sistemas corporais
2. **Genética Molecular** - DNA, RNA, proteínas, mutações
3. **Ecologia** - Ciclos biogeoquímicos, impactos ambientais
4. **Citologia** - Divisão celular, organelas, câncer
5. **Imunologia** - Vacinas, resposta imune

### Química (3ª Fase)
1. **Cinética Química** - Velocidade de reação, catalisadores
2. **Equilíbrio Químico** - Le Chatelier, constantes
3. **Química Orgânica** - Funções, reações, mecanismos
4. **Termoquímica** - Lei de Hess, entalpia
5. **Eletroquímica** - Pilhas, eletrólise, corrosão

## 🤖 Como Funciona a Correção por IA

O sistema analisa a resposta da aluna em 4 dimensões:

1. **Palavras-chave essenciais** (obrigatórias)
2. **Conceitos relacionados** (bônus)
3. **Estrutura da resposta** (introdução, desenvolvimento, conclusão)
4. **Correspondência com gabarito** (similaridade semântica)

### Algoritmo de Nota

```
Nota = (Palavras-chave × 0.4) + (Conceitos × 0.3) + 
       (Estrutura × 0.2) + (Gabarito × 0.1)
```

### Conceitos
- **A** (90-100%): Excelente - resposta completa e precisa
- **B** (75-89%): Bom - resposta quase completa
- **C** (60-74%): Regular - resposta parcial
- **D** (40-59%): Insuficiente - muitos erros
- **E** (0-39%): Crítico - resposta muito incompleta

## 📊 Estatísticas em Tempo Real

- Total de questões respondidas
- Taxa de acertos (%)
- Margem de erros restantes (máx. 17)
- Conceito projetado (A, B, C, D)
- Tempo de estudo
- Desempenho por matéria

## 🎓 Meta: Conceito A

Para garantir a bonificação de 20 pontos na 2ª fase:
- **43 acertos** em 60 questões (≥ 70%)
- Máximo de **17 erros** tolerados
- Foco nas matérias de maior peso

## 💡 Dicas de Estudo

1. **Priorize** as matérias com menor taxa de acerto
2. **Revise** os erros do Caderno regularmente
3. **Pratique** questões discursivas diariamente
4. **Simule** condições reais de prova (tempo, sem consulta)
5. **Analise** os padrões de cobrança da UERJ

## 🔧 Tecnologias

- React 18 + TypeScript
- Tailwind CSS 4
- Vite 6
- LocalStorage (persistência)
- Algoritmo de correção por IA

## 📱 Responsivo

Funciona em:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## 🎯 Próximos Passos

- [ ] Mais questões discursivas (20+)
- [ ] Correção de redação
- [ ] Simulados cronometrados
- [ ] Ranking entre alunos
- [ ] Exportar estatísticas (PDF)

---

**Boa sorte na sua jornada rumo ao Conceito A!** 🎓✨
