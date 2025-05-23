import { Injectable } from '@nestjs/common';
import { SessionState } from '../entities/session.entity';
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
  ) {}

  /**
   * Retorna o handler adequado para o estado atual da sessão
   */
  getHandler(state: SessionState): MenuHandler {
    switch (state) {
      case SessionState.MAIN_MENU:
        return this.mainMenuHandler;

      case SessionState.PROTOCOLO_MENU:
        return this.protocoloMenuHandler;

      case SessionState.CONSULTAR_MATRICULA:
      case SessionState.ESPERANDO_CPF_TELEFONE:
      case SessionState.RESULTADO_CONSULTA:
        return this.consultaMatriculaHandler;

      case SessionState.ASSISTENCIA_ESTUDANTIL:
        return this.assistenciaEstudantilHandler;

      case SessionState.CURSOS_INGRESSO:
        return this.cursosIngressoHandler;

      case SessionState.COMUNICACAO_SETORES:
        return this.comunicacaoSetoresHandler;

      case SessionState.TRANCAMENTO_REABERTURA:
        return this.trancamentoReaberturaHandler;

      case SessionState.EMITIR_DOCUMENTOS:
        return this.emitirDocumentosHandler;

      case SessionState.JUSTIFICAR_FALTAS:
        return this.justificarFaltasHandler;

      case SessionState.ACOMPANHAR_PROCESSOS:
        return this.acompanharProcessosHandler;

      default:
        // Em caso de estado não reconhecido, volta para o menu principal
        return this.mainMenuHandler;
    }
  }
}
