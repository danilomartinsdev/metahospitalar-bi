# packages/shared — Schemas, constantes e tipos compartilhados

Usado por apps/web e apps/api. Sem dependência de Nest, Nuxt ou Prisma — só Zod e TypeScript.
Status: código começa na Fase 1.

- src/schemas/ — Zod: DTOs, filtros de dashboard, linha de importação
- src/constants/ — UF→região (+ Exterior), papéis, permissões, status
- src/types/ — tipos inferidos (`z.infer`) e utilitários
- Dinheiro trafega como string decimal; nunca number.
- Mudou um schema? Rode typecheck dos dois apps.
