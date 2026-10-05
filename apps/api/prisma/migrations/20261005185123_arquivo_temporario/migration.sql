-- CreateTable
CREATE TABLE "ArquivoTemporario" (
    "id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquivoTemporario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArquivoTemporario_expiraEm_idx" ON "ArquivoTemporario"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "ArquivoTemporario_hash_usuarioId_tipo_key" ON "ArquivoTemporario"("hash", "usuarioId", "tipo");
