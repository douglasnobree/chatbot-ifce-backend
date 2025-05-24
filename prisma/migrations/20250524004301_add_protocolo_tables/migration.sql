-- CreateTable
CREATE TABLE "Protocolo" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "assunto" TEXT,
    "setor" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fechamento" TIMESTAMP(3),
    "sessao_id" TEXT,
    "estudante_id" TEXT,
    "atendente_id" TEXT,

    CONSTRAINT "Protocolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemProtocolo" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "protocolo_id" TEXT NOT NULL,

    CONSTRAINT "MensagemProtocolo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Protocolo_numero_key" ON "Protocolo"("numero");

-- AddForeignKey
ALTER TABLE "Protocolo" ADD CONSTRAINT "Protocolo_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "Sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocolo" ADD CONSTRAINT "Protocolo_estudante_id_fkey" FOREIGN KEY ("estudante_id") REFERENCES "Estudante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocolo" ADD CONSTRAINT "Protocolo_atendente_id_fkey" FOREIGN KEY ("atendente_id") REFERENCES "Atendente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemProtocolo" ADD CONSTRAINT "MensagemProtocolo_protocolo_id_fkey" FOREIGN KEY ("protocolo_id") REFERENCES "Protocolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
