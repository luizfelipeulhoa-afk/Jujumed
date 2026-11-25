# Jujumed

Aplicação de preparação para o Exame Discursivo de Medicina da UERJ 2027. O projeto usa TanStack Start, Vite, Supabase e Cloudflare Workers.

## Desenvolvimento

Requisitos: Bun e uma conta Supabase.

```sh
bun install
bun run dev
```

Configure as variáveis públicas do Supabase para o build e as chaves privadas no servidor:

```sh
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

As funções de tutoria e correção usam um endpoint compatível com a API de chat da OpenAI. Configure as credenciais no servidor; elas não devem usar o prefixo `VITE_` nem ser incluídas no navegador:

```sh
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
```

Essas variáveis continuam configurando a correção inteligente. A conversa do ursinho Juju, incluindo saudações, estetoscópio e pausa para respirar, usa exclusivamente o Gemini no servidor:

```sh
GEMINI_API_KEY=
```

Cadastre `GEMINI_API_KEY` como Secret em Cloudflare → jujumed → Settings → Variables and Secrets. Também são aceitas `GOOGLE_API_KEY` ou a chave Google já cadastrada em `AI_API_KEY`, nessa ordem. O chat usa `gemini-3.8-flash` no endpoint oficial do Google. Em falhas temporárias, o servidor repete a chamada com espera progressiva e limita o tempo total a 28 segundos.

A saudação inicial aparece sem consulta ao Gemini. O botão **Dar um oi** e as outras brincadeiras fazem chamadas sob demanda. A voz usa a síntese do Gemini. A camada gratuita do Gemini está sujeita às cotas da conta: https://ai.google.dev/gemini-api/docs/pricing.

## Chaves gratuitas: resumo, quiz, chat e transcrição

O resumo de aula e o chat do Totem usam o Gemini no modelo gratuito `gemini-3.8-flash`. O quiz e a transcrição de áudio usam a Groq, também na cota gratuita: o modelo aberto `openai/gpt-oss-20b` e o `whisper-large-v3`. As chamadas ficam no servidor. O navegador não recebe as chaves.

Não cadastre cartão nem plano pago nessas contas. Se a chave não estiver no servidor, a tela avisa em português e o resto do Jujumed continua abrindo. Se a cota gratuita estourar (HTTP 429), a tela pede para esperar um minuto, sem cobrança.

1. Gemini: crie a chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) e guarde com o nome `GEMINI_API_KEY`.
2. Groq: crie a chave em [console.groq.com/keys](https://console.groq.com/keys) e guarde com o nome `GROQ_API_KEY`.

O site está no Cloudflare Workers, no Worker `jujumed`. Em **Workers → jujumed → Settings → Variables and Secrets**, adicione cada nome como **Secret** (não como variável só de build). Publique de novo em seguida.

Na sua máquina, coloque as mesmas linhas em `.dev.vars` (o Wrangler lê esse arquivo no `bun run dev`). Se não existir `.dev.vars`, o `.env.local` também serve. Os dois arquivos ficam fora do Git. O `.env.example` só mostra os nomes, sem chave de verdade.

Não envie dados pessoais, nomes de pacientes nem casos clínicos reais. Na camada gratuita, o Gemini pode usar o que for enviado para melhorar os produtos do Google.

`CRON_SECRET` e, durante uma troca de chave, `CRON_SECRET_PREVIOUS` só são necessários se os endpoints cron protegidos forem usados.

## Publicar no Cloudflare Workers

1. No Cloudflare, crie um Worker e conecte este repositório GitHub. A branch de produção é `main`; a configuração Wrangler está em `wrangler.jsonc` e o nome do Worker é `jujumed`, igual ao nome já cadastrado no painel Cloudflare.
2. Em **Build configuration**, configure o comando de build `bun run build` e o comando de deploy `bunx wrangler deploy`. O build Vite precisa rodar antes do Wrangler para gerar os módulos de TanStack Start.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como variáveis de build. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_*`, `GEMINI_API_KEY` e `GROQ_API_KEY` no ambiente do Worker; marque as chaves privadas como secrets.
4. Para publicar pela sua máquina, execute `bun install`, `bunx wrangler login` e `bun run deploy`.
5. No Supabase, atualize a lista de URLs permitidas para incluir o domínio do Worker.

O backend Supabase continua no projeto já existente. Migrar o site não copia nem apaga dados. Para testar localmente, crie `.env.local` com as variáveis e mantenha os secrets fora do Git.
