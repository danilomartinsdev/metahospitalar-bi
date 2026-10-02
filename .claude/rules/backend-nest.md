---
paths:
  - "apps/api/src/**/*.ts"
---
# Convenções NestJS
- Um módulo por domínio. Controller fino → service com a regra → acesso a dados via Prisma.
- Todo endpoint tem `@RequirePermission(...)` e valida a entrada com schema Zod de packages/shared.
- Dados de vendas SÓ via `ScopedPedidosRepository`, que injeta o escopo do usuário.
  É proibido `prisma.pedido.*` fora dele (inclusive em export/ e dashboard/).
- Ações sensíveis (login, import, export, mudança de permissão) chamam AuditService.
- Erros via exceptions do Nest + filtro global; nunca expor stack ou SQL.
- Logs Pino com requestId; nunca logar senha, token ou payload completo de planilha.
