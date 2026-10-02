---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "apps/web/e2e/**"
---
# Testes
- Vitest para unidade/integração; Playwright para E2E.
- Testes de escopo RBAC rodam contra Postgres real (container de teste), nunca com mock do banco.
- Parser de importação é testado com os arquivos de fixtures/focco/amostras/ (anonimizados, versionados).
- Cálculos de KPI têm testes com valores esperados escritos à mão (ver docs/dados/metricas-kpis.md).
- Teste o comportamento, não a implementação; um caso de erro para cada caso feliz.
