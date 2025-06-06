/*
  Warnings:

  - Changed the type of `estado` on the `Sessao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('MAIN_MENU', 'PROTOCOLO_MENU', 'CONSULTAR_MATRICULA', 'ASSISTENCIA_ESTUDANTIL', 'CURSOS_INGRESSO', 'COMUNICACAO_SETORES', 'ESPERANDO_CPF_TELEFONE', 'RESULTADO_CONSULTA', 'TRANCAMENTO_REABERTURA', 'EMITIR_DOCUMENTOS', 'JUSTIFICAR_FALTAS', 'ACOMPANHAR_PROCESSOS', 'CONSULTANDO_PROTOCOLO', 'REGISTRO_DOCUMENTO_PENDENTE', 'AGUARDANDO_RESPOSTA_SETOR', 'ATENDIMENTO_HUMANO', 'ENCERRAMENTO', 'EXPIRED', 'AGUARDANDO_DADOS_ATENDIMENTO');

-- AlterTable
ALTER TABLE "Sessao" DROP COLUMN "estado",
ADD COLUMN     "estado" "SessionState" NOT NULL;
