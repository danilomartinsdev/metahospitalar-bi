-- CreateTable
CREATE TABLE "FaturamentoDia" (
    "id" UUID NOT NULL,
    "empresa" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "bruto" DECIMAL(14,2) NOT NULL,
    "antecipado" DECIMAL(14,2) NOT NULL,
    "remessa" DECIMAL(14,2) NOT NULL,
    "devolucao" DECIMAL(14,2) NOT NULL,
    "dre" DECIMAL(14,2) NOT NULL,
    "loteId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaturamentoDia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaturamentoLote" (
    "id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "arquivoHash" TEXT NOT NULL,
    "dias" INTEGER NOT NULL,
    "totalDre" DECIMAL(14,2) NOT NULL,
    "usuarioId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaturamentoLote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaturamentoDia_data_key" ON "FaturamentoDia"("data");

-- CreateIndex
CREATE INDEX "FaturamentoDia_ano_mes_idx" ON "FaturamentoDia"("ano", "mes");

-- CreateIndex
CREATE INDEX "FaturamentoDia_loteId_idx" ON "FaturamentoDia"("loteId");

-- CreateIndex
CREATE INDEX "FaturamentoLote_ano_idx" ON "FaturamentoLote"("ano");

-- AddForeignKey
ALTER TABLE "FaturamentoDia" ADD CONSTRAINT "FaturamentoDia_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "FaturamentoLote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaturamentoLote" ADD CONSTRAINT "FaturamentoLote_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Permissões novas do Faturamento para os papéis padrão que já existem (Admin e Gestor comercial).
INSERT INTO "RolePermission" ("roleId", "permissao", "createdAt", "updatedAt")
SELECT r."id", p.permissao, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Role" r
CROSS JOIN (VALUES ('faturamento.view'), ('faturamento.import')) AS p(permissao)
WHERE r."chave" IN ('admin', 'gestor-comercial')
ON CONFLICT ("roleId", "permissao") DO NOTHING;
