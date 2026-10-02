---
name: senior-backend
description: Boas práticas de backend (design de API REST, otimização de banco/Postgres, segurança, autenticação/autorização). Use ao projetar APIs, otimizar queries, implementar regra de negócio ou revisar código do apps/api.
---

# Senior Backend

Stack do projeto: NestJS (Fastify) + Prisma + PostgreSQL, TypeScript. Convenções obrigatórias em
`.claude/rules/backend-nest.md` e `docs/arquitetura/` — elas têm precedência sobre esta skill.

## Referências (leia a que for relevante)
- `references/api_design_patterns.md` — padrões de API, versionamento, paginação, erros.
- `references/database_optimization_guide.md` — índices, planos de execução, N+1, transações.
- `references/backend_security_practices.md` — validação, autenticação, segredos, rate limit.

## Checklist rápido
- Entrada validada (Zod de packages/shared); queries parametrizadas (Prisma).
- Autorização + escopo de dados em todo endpoint de vendas.
- Meça antes de otimizar (`EXPLAIN ANALYZE`); índices para colunas filtradas.
- Testes de integração contra Postgres real.
