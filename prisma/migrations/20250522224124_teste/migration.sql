/*
  Warnings:

  - A unique constraint covering the columns `[InstanceName]` on the table `WhatsAppSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WhatsAppSession" ADD COLUMN     "InstanceName" TEXT NOT NULL DEFAULT '1';

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_InstanceName_key" ON "WhatsAppSession"("InstanceName");
