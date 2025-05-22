-- CreateTable
CREATE TABLE "Estudante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "matricula" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "numero_telefone" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "jwt_token" TEXT NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" TEXT,
    "departamento" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "ultima_interacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instanceId" TEXT NOT NULL,
    "esperando_resposta" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "estudante_id" TEXT,
    "atendente_id" TEXT,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessao_id" TEXT NOT NULL,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudante_cpf_key" ON "Estudante"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Estudante_matricula_key" ON "Estudante"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_numero_telefone_key" ON "WhatsAppSession"("numero_telefone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_jwt_token_key" ON "WhatsAppSession"("jwt_token");

-- CreateIndex
CREATE UNIQUE INDEX "Atendente_email_key" ON "Atendente"("email");

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_estudante_id_fkey" FOREIGN KEY ("estudante_id") REFERENCES "Estudante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_atendente_id_fkey" FOREIGN KEY ("atendente_id") REFERENCES "Atendente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
