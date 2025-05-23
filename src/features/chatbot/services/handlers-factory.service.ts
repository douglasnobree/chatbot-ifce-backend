import { Injectable } from '@nestjs/common';
import { SessionState } from '@prisma/client';
import { MenuHandler } from '../interfaces/handler.interface';
import { MainMenuHandler } from '../handlers/main-menu.handler';
import { ProtocoloMenuHandler } from '../handlers/protocolo/protocolo-menu.handler';
import { ConsultaMatriculaHandler } from '../handlers/protocolo/consulta-matricula.handler';
import { AssistenciaEstudantilHandler } from '../handlers/assistencia/assistencia-estudantil.handler';
import { CursosIngressoHandler } from '../handlers/cursos/cursos-ingresso.handler';
import { ComunicacaoSetoresHandler } from '../handlers/comunicacao/comunicacao-setores.handler';
import {
  TrancamentoReaberturaHandler,
  EmitirDocumentosHandler,
  JustificarFaltasHandler,
  AcompanharProcessosHandler,
} from '../handlers/protocolo/outros-handlers';
import { RegistroDocumentosHandler } from '../handlers/documentos/registro-documentos.handler';
import { ProcessosAcompanhamentoHandler } from '../handlers/processos/processos-acompanhamento.handler';

@Injectable()
export class HandlersFactory {
  constructor(
    private readonly mainMenuHandler: MainMenuHandler,
    private readonly protocoloMenuHandler: ProtocoloMenuHandler,
    private readonly consultaMatriculaHandler: ConsultaMatriculaHandler,
    private readonly assistenciaEstudantilHandler: AssistenciaEstudantilHandler,
    private readonly cursosIngressoHandler: CursosIngressoHandler,
    private readonly comunicacaoSetoresHandler: ComunicacaoSetoresHandler,
    private readonly trancamentoReaberturaHandler: TrancamentoReaberturaHandler,
    private readonly emitirDocumentosHandler: EmitirDocumentosHandler,
    private readonly justificarFaltasHandler: JustificarFaltasHandler,
    private readonly acompanharProcessosHandler: AcompanharProcessosHandler,
    private readonly registroDocumentosHandler: RegistroDocumentosHandler,
    private readonly processosAcompanhamentoHandler: ProcessosAcompanhamentoHandler,
  ) {}

  /**
   * Retorna o handler adequado para o estado atual da sessão
   */ getHandler(state: SessionState): MenuHandler {
    switch (state) {
      // Menu principal
      case SessionState.MAIN_MENU:
        return this.mainMenuHandler;

      // Protocolo
      case SessionState.PROTOCOLO_MENU:
        return this.protocoloMenuHandler;

      // Consulta de matrícula
      case SessionState.CONSULTAR_MATRICULA:
      case SessionState.ESPERANDO_CPF_TELEFONE:
      case SessionState.RESULTADO_CONSULTA:
        return this.consultaMatriculaHandler;

      // Assistência Estudantil
      case SessionState.ASSISTENCIA_ESTUDANTIL:
        return this.assistenciaEstudantilHandler;

      // Cursos e Formas de Ingresso
      case SessionState.CURSOS_INGRESSO:
        return this.cursosIngressoHandler;

      // Comunicação com os setores
      case SessionState.COMUNICACAO_SETORES:
      case SessionState.AGUARDANDO_RESPOSTA_SETOR:
      case SessionState.ATENDIMENTO_HUMANO:
      case SessionState.AGUARDANDO_DADOS_ATENDIMENTO:
        return this.comunicacaoSetoresHandler;

      // Trancamento ou Reabertura
      case SessionState.TRANCAMENTO_REABERTURA:
        return this.trancamentoReaberturaHandler;

      // Documentos
      case SessionState.EMITIR_DOCUMENTOS:
      case SessionState.REGISTRO_DOCUMENTO_PENDENTE:
        return this.registroDocumentosHandler;

      // Faltas
      case SessionState.JUSTIFICAR_FALTAS:
        return this.justificarFaltasHandler;

      // Acompanhamento de Processos
      case SessionState.ACOMPANHAR_PROCESSOS:
      case SessionState.CONSULTANDO_PROTOCOLO:
        return this.processosAcompanhamentoHandler;

      default:
        // Em caso de estado não reconhecido, volta para o menu principal
        return this.mainMenuHandler;
    }
  }
}
