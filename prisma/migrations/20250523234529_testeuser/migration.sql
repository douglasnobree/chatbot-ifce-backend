/*
  Warnings:

  - You are about to drop the column `atualizado_em` on the `Estudante` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `Estudante` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `Estudante` table. All the data in the column will be lost.
  - You are about to drop the column `escolhaSetor` on the `Estudante` table. All the data in the column will be lost.
  - You are about to drop the column `last_quoted_message` on the `Estudante` table. All the data in the column will be lost.
  - You are about to drop the column `matricula` on the `Estudante` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telefone]` on the table `Estudante` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Estudante` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `Estudante` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Estudante_cpf_key";

-- DropIndex
DROP INDEX "Estudante_matricula_key";

-- AlterTable
ALTER TABLE "Estudante" DROP COLUMN "atualizado_em",
DROP COLUMN "cpf",
DROP COLUMN "criado_em",
DROP COLUMN "escolhaSetor",
DROP COLUMN "last_quoted_message",
DROP COLUMN "matricula",
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Estudante_telefone_key" ON "Estudante"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Estudante_email_key" ON "Estudante"("email");
