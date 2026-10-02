# apps/web — Frontend Nuxt 4 (SPA, ssr: false)

Rodar: `pnpm --filter web dev` (porta 4317, proxy /api → 4318)
Status: código começa na Fase 1.

- pages/ define rotas; layouts: default (sidebar), auth, print (PDF)
- Dados do servidor sempre via composables em composables/api (TanStack Query)
- Filtros globais: store `filters`, sincronizada com a query string
- Rotas /print/* existem só para o gerador de PDF — sem interação, sem sidebar
- Componentes: ui/ (shadcn-vue, gerado) · charts/ · dashboard/ · layout/
- utils/format.ts (pt-BR) e utils/charts/*.ts (options puras + palette.ts)
- assets/css/tokens.css define os tokens; ver docs/design/design-system.md
- Logos em public/brand/
- E2E em e2e/ (Playwright), um usuário por papel vindo do seed
