---
name: novo-modulo-api
description: Cria um módulo NestJS completo (controller, service, DTOs Zod em packages/shared, permissões, auditoria e testes). Use ao adicionar um novo domínio ou recurso na API.
---
1. Defina os schemas Zod em packages/shared/src/schemas/<dominio>.ts e exporte os tipos.
2. Adicione as permissões novas em packages/shared/src/constants/permissions.ts e no seed de papéis.
3. Gere módulo, controller e service em apps/api/src/modules/<dominio>/.
4. Todo endpoint: @RequirePermission + validação Zod + escopo de dados se tocar em vendas
   (ScopedPedidosRepository — nunca prisma.pedido.* direto).
5. Ações sensíveis chamam AuditService.
6. Testes: unitário do service + integração do controller cobrindo 403 para papel sem permissão
   e, se tocar em vendas, um caso provando que outro escopo não vaza.
7. Atualize docs/arquitetura/api.md e rode a skill checagem-completa.
8. Rode o subagente revisor-rbac sobre os arquivos novos.
