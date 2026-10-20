# Alinhamento do Jujumed ao Exame Discursivo UERJ 2027

## Objetivo
Atualizar a experiência inteira para a etapa de Medicina do Vestibular Estadual UERJ 2027, substituindo a lógica antiga dos Exames de Qualificação por uma preparação centrada no Exame Discursivo de 29 de novembro de 2026.

## O que será alterado

### 1. Página principal e conteúdo oficial
- Remover referências ao “2º EQ”, “3ª Fase”, “Prova de Domingo”, 6 de setembro de 2026 e “O Cortiço”.
- Exibir contagem regressiva em tempo real para 29/11/2026.
- Apresentar “Exame Discursivo” como nomenclatura oficial em toda a interface.
- Criar a área de Literatura/Redação com “O bem-amado”, de Dias Gomes, incluindo guia temático e eixos sociopolíticos.

### 2. Simulados e projeção da nota
- Reorganizar o simulador em três cadernos independentes:
  - Biologia: 10 questões, nota de 0 a 20 e peso 2.
  - Química: 10 questões, nota de 0 a 20 e peso 1.
  - Redação: proposta argumentativa de 20 a 30 linhas sobre “O bem-amado”, nota de 0 a 20 e peso 1.
- Adicionar ao perfil a seleção do conceito obtido nos Exames de Qualificação e converter A/B/C/D em 20/15/10/5 pontos.
- Mostrar “Aguardando Diagnóstico” para perfis sem resultados avaliados.
- Calcular e exibir a projeção por `Bônus EQ + Biologia × 2 + Química + Redação`, limitada a 100 pontos.

### 3. Correção discursiva com IA e proteção
- Ativar Lovable Cloud para executar a avaliação de forma segura, mantendo a credencial de IA fora do navegador.
- Implementar correção por IA com rubrica analítica por item de comando, pontuação explícita e comparação com o padrão esperado da banca DSEA.
- Rejeitar contradições e listas desconexas de palavras-chave como evidência de domínio.
- Detectar padrões de injeção antes da chamada à IA e devolver nota zero com “Violação de critério de resposta identificada”.
- Exibir, para cada resposta, a pontuação por critério, o que faltou para a nota máxima e a comparação com o padrão esperado.

### 4. Caderno de Erros
- Exigir uma causa para cada erro: Conteúdo/Teoria, Interpretação do Comando/Gráfico, Erro de Cálculo/Unidade ou Gestão do Tempo.
- Registrar a data do erro e agendar automaticamente a revisão ativa para três dias depois.
- Destacar revisões vencidas, previstas e concluídas, preservando os dados por perfil.

## Validação
- Testar a contagem regressiva, a configuração do conceito EQ e a fórmula da nota projetada.
- Percorrer os três cadernos, incluindo uma resposta válida e uma tentativa de injeção.
- Confirmar o detalhamento da rubrica e o padrão DSEA no retorno da correção.
- Registrar um erro, selecionar sua causa e confirmar a revisão agendada para três dias depois.
- Revisar telas grandes e pequenas, além de erros de execução e compilação.

## Detalhes técnicos
- Manter a navegação e o armazenamento por perfil já existentes, migrando dados antigos sem quebrar o acesso.
- Usar uma função de servidor para a IA e o modelo padrão do gateway, com respostas transmitidas e tratamento explícito de limites, créditos e indisponibilidade.
- Concentrar regras de pontuação e datas em módulos testáveis para evitar divergências entre a página principal, os simulados e o caderno.
