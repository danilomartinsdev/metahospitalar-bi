# ADR 0002 — Nuxt 4 em modo SPA + NestJS (Fastify)

**Status:** aceito (2026-10-02)

## Contexto
Aplicação interna autenticada; SEO irrelevante. Precisa de dashboards ricos, regras de acesso
fortes no servidor, importação de planilhas e geração de PDF.

## Decisão
- **Frontend:** Nuxt 4 com `ssr: false` (SPA), Tailwind v4, shadcn-vue (Reka UI), vue-echarts,
  TanStack Query/Table, Pinia, VeeValidate + Zod.
- **Backend:** NestJS com adaptador Fastify, Prisma + PostgreSQL 16, nestjs-zod, CASL, Pino.
- Nuxt não é usado como backend (sem server routes de negócio).

## Consequências
- Front é estático (servido pelo Caddy); toda segurança fica na API.
- Separação clara de responsabilidades; NestJS dá módulos, guards e DI para RBAC/auditoria.
- Duas aplicações para rodar em dev (`pnpm dev` sobe ambas, proxy `/api`).
