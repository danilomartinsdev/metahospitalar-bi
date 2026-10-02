# ADR 0006 — Ajustes às versões disponíveis (Fase 1)

**Status:** aceito (2026-10-02)

## Contexto

Na Fase 1, as versões mais novas tinham incompatibilidades com a stack planejada.

## Decisões

| Item planejado            | Situação                      | Decisão                                                                             |
| ------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| TypeScript "latest" (7.x) | typescript-eslint exige < 6.1 | TypeScript **6.0**                                                                  |
| Prisma "latest" (8 RC)    | release candidate             | Prisma **7.10** estável, `prisma-client` + `@prisma/adapter-pg`, `prisma.config.ts` |
| NestJS 12                 | ESM-only                      | API em ESM (`type: module`, imports `.js`)                                          |
| nestjs-zod                | não suporta Nest 12           | `ZodPipe` próprio (`common/zod-validation.pipe.ts`)                                 |
| @vee-validate/zod         | exige Zod 3                   | adaptador próprio `utils/zod-form.ts` (Zod 4)                                       |
| @nestjs/jwt               | —                             | `jose` (ESM, HS256 com issuer/audience/jti)                                         |
| CASL                      | sem escopo na Fase 1          | checagem por permissão no `AuthGuard`; CASL entra na Fase 4 com o escopo            |
| Seed em TS                | Node não resolve `.js`→`.ts`  | `tsx` para seed e scripts                                                           |
| `prisma migrate reset`    | bloqueado para agentes de IA  | E2E usa `migrate deploy` + `TRUNCATE` só em bancos `*_test`                         |

## Consequências

Reavaliar `nestjs-zod` e `@vee-validate/zod` quando suportarem as versões atuais.
