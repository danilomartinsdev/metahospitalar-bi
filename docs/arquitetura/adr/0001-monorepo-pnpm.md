# ADR 0001 — Monorepo com pnpm workspaces

**Status:** aceito (2026-10-02)

## Contexto
Frontend e backend compartilham schemas de validação, constantes (UF→região, permissões,
status) e tipos. Equipe pequena, um único produto.

## Decisão
Monorepo pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`. TypeScript estrito em todos.
Scripts orquestrados na raiz (`pnpm -r`/`--filter`). Sem Nx/Turborepo por enquanto.

## Consequências
- Um PR muda contrato e consumidores juntos; schemas Zod únicos.
- CI único; build do shared antes dos apps.
- Se o build ficar lento, avaliar Turborepo (novo ADR).
