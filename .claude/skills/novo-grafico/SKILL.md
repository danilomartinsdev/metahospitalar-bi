---
name: novo-grafico
description: Cria um gráfico ECharts no padrão do projeto (função pura de options em utils/charts, wrapper no BaseChart, teste, estados loading/vazio/erro, light/dark). Use ao adicionar qualquer gráfico ao frontend.
---
1. Leia docs/design/design-system.md (seção Gráficos).
2. Crie a função pura `build<Nome>Options(data, theme)` em apps/web/app/utils/charts/<nome>.ts:
   - cores de utils/charts/palette.ts e tokens do tema recebido — nenhum hex solto;
   - valores formatados via utils/format.ts (formatBRL, formatPct, formatCompact).
3. Teste a função em <nome>.test.ts (Vitest): séries, eixos, formatação e caso de dados vazios.
4. Crie o componente em components/charts/<Nome>Chart.vue usando BaseChart:
   recebe dados já agregados, trata loading (skeleton), vazio e erro.
5. Garanta acessibilidade: `aria-label` com resumo do gráfico e tabela equivalente quando fizer sentido.
6. Valide visualmente no navegador em light e dark e em largura de celular.
7. Rode a skill checagem-completa.
