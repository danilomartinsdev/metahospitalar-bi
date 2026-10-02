---
name: checagem-completa
description: Roda lint, typecheck, testes e build do monorepo e resume o resultado. Use antes de declarar uma tarefa concluída, antes de commit e ao fim de cada fase.
---
Execute na raiz, em sequência, sem parar no primeiro erro:
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`
5. Se a mudança tocou fluxo de usuário: `pnpm test:e2e`
6. `pnpm hooks:test` se algo em .claude/hooks mudou.

Depois apresente um resumo em tabela: etapa | status (ok/falhou/não existe ainda) | observação.
Para cada falha, mostre o trecho relevante do erro e o arquivo:linha. Nunca reporte como "ok"
uma etapa que não rodou. Não corrija nada automaticamente sem dizer o que mudou.
