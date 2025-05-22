/*
  Warnings:

  - You are about to drop the column `instanceId` on the `Sessao` table. All the data in the column will be lost.
  - Added the required column `instanceName` to the `Sessao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sessao" DROP COLUMN "instanceId",
ADD COLUMN     "instanceName" TEXT NOT NULL;
