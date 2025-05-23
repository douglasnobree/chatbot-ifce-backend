-- CreateTable
CREATE TABLE "Estatistica" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_sessoes" INTEGER NOT NULL DEFAULT 0,
    "sessoes_ativas" INTEGER NOT NULL DEFAULT 0,
    "duracao_media_sessao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estatistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuAcesso" (
    "id" TEXT NOT NULL,
    "tipo_menu" TEXT NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 0,
    "ultimo_acesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatistica_id" TEXT NOT NULL,

    CONSTRAINT "MenuAcesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MenuAcesso" ADD CONSTRAINT "MenuAcesso_estatistica_id_fkey" FOREIGN KEY ("estatistica_id") REFERENCES "Estatistica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
