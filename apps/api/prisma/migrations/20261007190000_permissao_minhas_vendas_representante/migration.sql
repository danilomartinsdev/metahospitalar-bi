-- "Ver Minhas vendas" (checkbox em Papéis): marcada só no papel Representante. O Admin não recebe —
-- é a única permissão fora das "todas" do Admin (PERMISSOES_ADMIN em packages/shared).
INSERT INTO "RolePermission" ("roleId", "permissao", "createdAt", "updatedAt")
SELECT r."id", 'minhas-vendas.view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" r
WHERE r."chave" = 'representante'
ON CONFLICT ("roleId", "permissao") DO NOTHING;
