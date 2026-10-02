# apps/api — Backend NestJS (Fastify) + Prisma

Rodar: `pnpm db:up` e depois `pnpm --filter api dev` (porta 4318, prefixo /api)
Status: código começa na Fase 1.

- src/main.ts — bootstrap Fastify, Helmet, CORS, rate limit, Pino
- src/config/ — env validado com Zod (falha no boot se faltar variável)
- src/common/ — guards (auth, permissão), decorators (@RequirePermission, @Public, @CurrentUser), filtro de exceções
- src/modules/ — auth, users, roles, audit, pedidos, clientes, representantes, metas, dashboard, import, export
- Dados de vendas só via ScopedPedidosRepository (módulo pedidos)
- prisma/schema.prisma · migrations/ (nunca editar aplicadas) · seed.ts (idempotente, 1 usuário por papel)
- Testes de integração/escopo contra Postgres real (container de teste)
