-- CreateEnum
CREATE TYPE "Regiao" AS ENUM ('NORTE', 'NORDESTE', 'CENTRO_OESTE', 'SUDESTE', 'SUL', 'EXTERIOR');

-- CreateEnum
CREATE TYPE "Segmento" AS ENUM ('PUBLICO', 'PRIVADO');

-- CreateEnum
CREATE TYPE "EscopoTipo" AS ENUM ('TODOS', 'REGIAO', 'REPRESENTANTES');

-- CreateEnum
CREATE TYPE "LoteStatus" AS ENUM ('APLICADO', 'REVERTIDO');

-- CreateEnum
CREATE TYPE "LoteItemAcao" AS ENUM ('CRIADO', 'ATUALIZADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "trocarSenha" BOOLEAN NOT NULL DEFAULT true,
    "tentativasFalhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "ultimoAcessoEm" TIMESTAMP(3),
    "escopoTipo" "EscopoTipo" NOT NULL DEFAULT 'REPRESENTANTES',
    "escopoRegioes" "Regiao"[] DEFAULT ARRAY[]::"Regiao"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissao")
);

-- CreateTable
CREATE TABLE "UsuarioRepresentante" (
    "usuarioId" UUID NOT NULL,
    "representanteId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioRepresentante_pkey" PRIMARY KEY ("usuarioId","representanteId")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familia" UUID NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "ultimoUsoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadaEm" TIMESTAMP(3),
    "substituidaEm" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRedefinicaoSenha" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenRedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenImpressao" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "filtros" JSONB NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenImpressao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representante" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nomeExibicao" TEXT NOT NULL,
    "segmentoPadrao" "Segmento",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Representante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "segmentoOverride" "Segmento",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPdv" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "contaNoTotal" BOOLEAN NOT NULL DEFAULT true,
    "cor" TEXT NOT NULL DEFAULT 'muted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPdv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" UUID NOT NULL,
    "focoId" INTEGER NOT NULL,
    "numPedido" TEXT NOT NULL,
    "ordemCpr" TEXT,
    "dtEmissao" DATE NOT NULL,
    "dtEntrega" DATE,
    "competencia" DATE NOT NULL,
    "statusId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "representanteId" UUID NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "regiao" "Regiao" NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "ultimoLoteId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "representanteId" UUID,
    "valor" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLote" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "arquivoHash" TEXT NOT NULL,
    "arquivoTamanho" INTEGER NOT NULL,
    "arquivoPath" TEXT NOT NULL,
    "novos" INTEGER NOT NULL DEFAULT 0,
    "atualizados" INTEGER NOT NULL DEFAULT 0,
    "inalterados" INTEGER NOT NULL DEFAULT 0,
    "ignorados" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "status" "LoteStatus" NOT NULL DEFAULT 'APLICADO',
    "revertidoEm" TIMESTAMP(3),
    "revertidoPorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLoteItem" (
    "id" UUID NOT NULL,
    "loteId" UUID NOT NULL,
    "focoId" INTEGER NOT NULL,
    "acao" "LoteItemAcao" NOT NULL,
    "snapshotAnterior" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportLoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_roleId_idx" ON "Usuario"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_chave_key" ON "Role"("chave");

-- CreateIndex
CREATE INDEX "UsuarioRepresentante_representanteId_idx" ON "UsuarioRepresentante"("representanteId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_tokenHash_key" ON "Sessao"("tokenHash");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE INDEX "Sessao_familia_idx" ON "Sessao"("familia");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRedefinicaoSenha_tokenHash_key" ON "TokenRedefinicaoSenha"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenRedefinicaoSenha_usuarioId_idx" ON "TokenRedefinicaoSenha"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenImpressao_tokenHash_key" ON "TokenImpressao"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenImpressao_usuarioId_idx" ON "TokenImpressao"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_acao_idx" ON "AuditLog"("acao");

-- CreateIndex
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Representante_codigo_key" ON "Representante"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nomeNormalizado_key" ON "Cliente"("nomeNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPdv_codigo_key" ON "StatusPdv"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_focoId_key" ON "Pedido"("focoId");

-- CreateIndex
CREATE INDEX "Pedido_dtEmissao_idx" ON "Pedido"("dtEmissao");

-- CreateIndex
CREATE INDEX "Pedido_competencia_idx" ON "Pedido"("competencia");

-- CreateIndex
CREATE INDEX "Pedido_uf_idx" ON "Pedido"("uf");

-- CreateIndex
CREATE INDEX "Pedido_regiao_idx" ON "Pedido"("regiao");

-- CreateIndex
CREATE INDEX "Pedido_representanteId_idx" ON "Pedido"("representanteId");

-- CreateIndex
CREATE INDEX "Pedido_clienteId_idx" ON "Pedido"("clienteId");

-- CreateIndex
CREATE INDEX "Pedido_statusId_idx" ON "Pedido"("statusId");

-- CreateIndex
CREATE INDEX "Meta_representanteId_idx" ON "Meta"("representanteId");

-- CreateIndex
CREATE UNIQUE INDEX "Meta_ano_mes_representanteId_key" ON "Meta"("ano", "mes", "representanteId");

-- CreateIndex
CREATE INDEX "ImportLote_createdAt_idx" ON "ImportLote"("createdAt");

-- CreateIndex
CREATE INDEX "ImportLote_arquivoHash_idx" ON "ImportLote"("arquivoHash");

-- CreateIndex
CREATE INDEX "ImportLoteItem_loteId_idx" ON "ImportLoteItem"("loteId");

-- CreateIndex
CREATE INDEX "ImportLoteItem_focoId_idx" ON "ImportLoteItem"("focoId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRepresentante" ADD CONSTRAINT "UsuarioRepresentante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRepresentante" ADD CONSTRAINT "UsuarioRepresentante_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES "Representante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRedefinicaoSenha" ADD CONSTRAINT "TokenRedefinicaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenImpressao" ADD CONSTRAINT "TokenImpressao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusPdv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES "Representante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_ultimoLoteId_fkey" FOREIGN KEY ("ultimoLoteId") REFERENCES "ImportLote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES "Representante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLote" ADD CONSTRAINT "ImportLote_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLote" ADD CONSTRAINT "ImportLote_revertidoPorId_fkey" FOREIGN KEY ("revertidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLoteItem" ADD CONSTRAINT "ImportLoteItem_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "ImportLote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
