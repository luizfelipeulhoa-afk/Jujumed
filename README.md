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

1. No Cloudflare, crie um Worker e conecte este repositório GitHub. A branch de produção é `main`; a configuração Wrangler está em `wrangler.jsonc` e o nome do Worker é `jujumed`, igual ao nome já cadastrado no painel Cloudflare.
2. Em **Build configuration**, configure o comando de build `bun run build` e o comando de deploy `bunx wrangler deploy`. O build Vite precisa rodar antes do Wrangler para gerar os módulos de TanStack Start.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como variáveis de build. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `AI_*` no ambiente do Worker; marque as chaves privadas como secrets.
4. Para publicar pela sua máquina, execute `bun install`, `bunx wrangler login` e `bun run deploy`.
5. No Supabase, atualize a lista de URLs permitidas para incluir o domínio do Worker.

O backend Supabase continua no projeto já existente. Migrar o site não copia nem apaga dados. Para testar localmente, crie `.env.local` com as variáveis e mantenha os secrets fora do Git.
