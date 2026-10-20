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

Essas variáveis são necessárias para a JujuBot e para a correção inteligente. `CRON_SECRET` e, durante uma troca de chave, `CRON_SECRET_PREVIOUS` só são necessários se os endpoints cron protegidos forem usados.

## Publicar no Cloudflare Workers

1. Conecte este repositório a uma conta Cloudflare e instale as dependências com `bun install`.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como variáveis de build. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `AI_*` no ambiente do Worker; marque as chaves privadas como secrets.
3. Execute `bun run deploy` localmente após `bunx wrangler login`, ou configure o Cloudflare para construir com `bun run build` e publicar com `bunx wrangler deploy`.
4. No Supabase, atualize a lista de URLs permitidas para incluir o domínio do Worker.

O backend Supabase continua no projeto já existente. Migrar o site não copia nem apaga dados. Para testar localmente, crie `.env.local` com as variáveis e mantenha os secrets fora do Git.
