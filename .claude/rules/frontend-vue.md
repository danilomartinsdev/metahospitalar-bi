---
paths:
  - 'apps/web/**/*.vue'
  - 'apps/web/**/*.ts'
---

# Convenções Vue/Nuxt

- Sempre `<script setup lang="ts">` e Composition API.
- Dados remotos: composables `useXxxQuery`/`useXxxMutation` (TanStack Query); nada de fetch solto em componente.
- Opções do ECharts são geradas por funções puras em utils/charts/ (testáveis); componentes só renderizam.
- Formatação só via utils/format.ts (formatBRL, formatDate, formatPct, formatCompact).
- Todo componente de dados trata loading (skeleton), vazio e erro.
- `useCan('permissao')` controla o que aparece na UI — é conveniência, a segurança está no backend.
- Componentes de interface vêm do Nuxt UI v4 (ADR 0007): prefira compor UButton/UTable/UModal… a criar do zero. Ícones só via UIcon (i-lucide-*).
- Na UI use sempre "Representante" (nunca "Gestor"); internamente o nome é `gestor` (ver glossário).
