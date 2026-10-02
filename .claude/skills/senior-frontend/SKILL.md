---
name: senior-frontend
description: Boas práticas de frontend (componentização, performance, estado, acessibilidade, bundle). Use ao desenvolver telas, otimizar performance ou revisar código do apps/web.
---

# Senior Frontend

Stack do projeto: Nuxt 4 (SPA) + Vue 3 + Tailwind v4 + shadcn-vue + ECharts, TypeScript.
Convenções obrigatórias em `.claude/rules/frontend-vue.md` e `.claude/rules/design-system.md` —
elas têm precedência sobre esta skill. As referências abaixo usam exemplos React/Next; aplique
os princípios com os equivalentes Vue (composables, `computed`, `defineAsyncComponent`).

## Referências
- `references/frontend_best_practices.md` — componentização, estado, acessibilidade.
- `references/react_patterns.md` — padrões (traduzir para Composition API).
- `references/nextjs_optimization_guide.md` — performance/bundle (traduzir para Nuxt/Vite).

## Checklist rápido
- Loading/vazio/erro em todo bloco de dados; skeleton sem "pulo" de layout.
- Lazy-load de rotas e gráficos pesados; nada de lib inteira por um ícone.
- Teclado e foco visível; contraste AA; light e dark testados; celular testado.
