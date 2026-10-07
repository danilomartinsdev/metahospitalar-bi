-- Permissão nova "Ver Minhas vendas" para os papéis padrão que já existem (Admin mantém todas;
-- Representante é quem usa a tela). Papéis criados depois recebem pelo seed/DEFAULT_ROLES.
INSERT INTO "RolePermission" ("roleId", "permissao", "createdAt", "updatedAt")
SELECT r."id", 'minhas-vendas.view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" r
WHERE r."chave" IN ('admin', 'representante')
ON CONFLICT ("roleId", "permissao") DO NOTHING;
