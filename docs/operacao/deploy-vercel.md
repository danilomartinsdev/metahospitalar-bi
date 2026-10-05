# Deploy na Vercel (site + API) com banco no Neon e domínio no HostGator

Decisão e motivos: [ADR 0008](../arquitetura/adr/0008-hospedagem-vercel.md).
Deploy em servidor próprio com Docker continua em [deploy.md](deploy.md).

## Visão geral

| Peça         | Onde                                                        | Endereço                                                    |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Site (telas) | Vercel — projeto **metabi-web** (Root Directory `apps/web`) | `https://bi.seudominio.com.br`                              |
| API          | Vercel — projeto **metabi-api** (Root Directory `apps/api`) | `https://metabi-api.vercel.app` (o site a chama por `/api`) |
| Banco        | Neon (PostgreSQL)                                           | —                                                           |
| Domínio      | cPanel do HostGator (Editor de Zona)                        | CNAME `bi` → `cname.vercel-dns.com`                         |

## 1. Banco no Neon (pelo painel da Vercel)

Caminho escolhido: criar o Neon pela própria Vercel (cobrança e acesso na conta Vercel).
Faça depois de criar o projeto da API (passo 2, antes do primeiro deploy):

1. Vercel › projeto **metabi-api** › **Storage › Create Database › Neon** (região São Paulo, se houver) › conecte ao projeto.
2. A integração cria as variáveis de conexão. Confira em **Settings › Environment Variables**:
   - `DATABASE_URL` deve ser a URL **pooled** (host com `-pooler`);
   - `DATABASE_URL_UNPOOLED` (URL direta, sem `-pooler`) é usada pelas migrations automaticamente — não precisa
     criar `DATABASE_URL_DIRECT` (o valor é sensível e a Vercel não deixa copiá-lo).

Alternativa: conta própria em https://neon.tech, copiando as mesmas duas URLs de **Connection Details**.

## 2. Projeto da API na Vercel

Antes: no GitHub, **Settings › General › Default branch** = `main`. Ao importar, a Vercel já tenta um primeiro
deploy; se falhar por falta de banco/variáveis, tudo bem — complete os passos e use **Deployments › Redeploy**.

1. Crie a conta em https://vercel.com entrando com o GitHub.
2. **Add New › Project** › importe `danilomartinsdev/metahospitalar-bi`.
3. **Root Directory:** `apps/api` · Framework: _Other_ (o `apps/api/vercel.json` define o build).
4. **Environment Variables** (Production):

| Variável                                                                           | Valor                                                                                     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                         | `production`                                                                              |
| `DATABASE_URL`                                                                     | URL **pooled** do Neon (criada pela integração)                                           |
| `DATABASE_URL_UNPOOLED`                                                            | URL **direta** do Neon (criada pela integração; ou `DATABASE_URL_DIRECT` se Neon próprio) |
| `JWT_ACCESS_SECRET`                                                                | segredo forte (está no arquivo `meta-bi-vercel-api.env` gerado no seu computador)         |
| `WEB_ORIGIN`, `APP_URL`, `PRINT_BASE_URL`                                          | `https://bi.seudominio.com.br`                                                            |
| `COOKIE_SECURE`                                                                    | `true`                                                                                    |
| `IMPORT_MAX_FILE_MB`                                                               | `4`                                                                                       |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | e-mail (se ainda não tiver, valores fictícios — só o "esqueci minha senha" não funciona)  |

5. **Settings › Git › Production Branch** = `main` (o default do GitHub ainda é `fase-0-contexto`).
6. **Deploy.** O build roda as migrations no Neon. Anote o endereço do projeto (ex.: `https://metabi-api.vercel.app`).
7. Teste: `https://metabi-api.vercel.app/api/health` deve responder `{"status":"ok"...}`.

## 3. Levar a base atual para o Neon (uma vez)

No seu computador, com o Docker de desenvolvimento rodando (troque `URL_DIRECT_DO_NEON`):

```bash
docker exec meta-bi-postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner' > meta-bi-base.dump
docker run --rm -i postgres:16-alpine pg_restore --clean --if-exists --no-owner -d "URL_DIRECT_DO_NEON" < meta-bi-base.dump
del meta-bi-base.dump   # (PowerShell) — o arquivo tem dados de clientes: não guarde nem envie
```

Depois, em Administração › Usuários, desative os usuários de exemplo (`admin@`, `gestor@`, `representante@`,
`visualizador@metahospitalar.com.br`).

## 4. Projeto do site na Vercel

1. **Add New › Project** › o mesmo repositório de novo.
2. **Root Directory:** `apps/web` · Framework: _Other_.
3. **Environment Variables:** `API_ORIGIN` = endereço da API do passo 2 (ex.: `https://metabi-api.vercel.app`).
4. **Settings › Git › Production Branch** = `main`.
5. **Deploy.**

## 5. Domínio

1. Vercel › projeto **metabi-web** › **Settings › Domains** › adicione `bi.seudominio.com.br`.
2. cPanel do HostGator › **Editor de Zona** › domínio › **+ CNAME**:
   - Nome: `bi` · Registro: `cname.vercel-dns.com`
3. Em alguns minutos a Vercel valida e emite o HTTPS. Acesse `https://bi.seudominio.com.br`.

## Atualizações

Cada `git push` na `main` faz a Vercel publicar os dois projetos de novo (migrations rodam no build da API).

## Problemas comuns

| Sintoma                                | O que fazer                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Build da API falha em `migrate deploy` | Confira `DATABASE_URL_UNPOOLED`/`DATABASE_URL_DIRECT` (URL sem `-pooler`)                               |
| Login não mantém a sessão              | `WEB_ORIGIN`/`APP_URL` devem ser o domínio do site, com `https://`; `COOKIE_SECURE=true`                |
| Site abre mas dados dão erro           | `API_ORIGIN` do projeto web errado; teste `/api/health` direto na API                                   |
| PDF falha                              | Vercel › metabi-api › Logs; a função precisa de 2 GB/60 s (já no `vercel.json`) — plano Pro recomendado |
| Primeira tela demora                   | Normal após um tempo sem uso (a função "acorda" em alguns segundos)                                     |
