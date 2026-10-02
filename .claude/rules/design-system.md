---
paths:
  - "apps/web/**/*.vue"
  - "apps/web/app/assets/**"
---
# Design system
Leia docs/design/design-system.md antes de criar componente visual novo.
- Cores só via variáveis CSS/tokens Tailwind — nenhum hex em componente.
- Cards: borda 1px var(--border), raio 12px, sem sombra pesada.
- Números: `tabular-nums`; valores monetários alinhados à direita em tabelas.
- Paleta de gráficos vem de utils/charts/palette.ts.
- Testar todo componente novo em light e dark.
