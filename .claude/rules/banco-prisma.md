---
paths:
  - "apps/api/prisma/**"
---
# Banco
Referência das tabelas: docs/dados/dicionario-de-dados.md (mantenha atualizado ao mudar o schema).
- Nunca edite migration já aplicada: crie uma nova (o hook protect-paths bloqueia).
- Dinheiro: Decimal(14,2). Toda tabela tem createdAt/updatedAt.
- Índices para colunas filtradas: dtEmissao, uf, representanteId, clienteId, status.
- Seed idempotente (upsert), com um usuário de cada papel para testes E2E.
