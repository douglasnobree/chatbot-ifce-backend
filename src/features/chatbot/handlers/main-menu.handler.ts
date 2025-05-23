import { Injectable } from '@nestjs/common';
import { Session, SessionState } from '../entities/session.entity';
import { MenuHandler } from '../interfaces/handler.interface';
import { SessionService } from '../services/session.service';
import { MensagensService } from '../services/mensagens.service';
import { OperacoesBaseService } from '../services/operacoes-base.service';
import { MenuTexts } from '../constants/menu-texts';

@Injectable()
export class MainMenuHandler implements MenuHandler {
  constructor(
    private readonly sessionService: SessionService,
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  /**
   * Exibe o menu principal
   */
  async exibirMenu(session: Session): Promise<void> {
    await this.operacoesBaseService.exibirMenuPrincipal(session);
  }

  /**
   * Processa a interação do usuário com o menu principal
   */
  async processarMensagem(session: Session, mensagem: string): Promise<void> {
    const msgNormalizada = mensagem.trim().toLowerCase();

    switch (msgNormalizada) {
      case '1':
        // Protocolo
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.PROTOCOLO_MENU,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.PROTOCOLO_MENU,
        );
        break;

      case '2':
        // Assistência Estudantil
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.ASSISTENCIA_ESTUDANTIL,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.ASSISTENCIA_ESTUDANTIL,
        );
        break;

      case '3':
        // Cursos e Formas de Ingresso
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.CURSOS_INGRESSO,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.CURSOS_INGRESSO,
        );
        break;

      case '4':
        // Comunicação com os setores
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.COMUNICACAO_SETORES,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.COMUNICACAO_SETORES,
        );
        break;

      case '5':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      default:
        // Opção inválida
        await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
          this.exibirMenu(session),
        );
    }
  }
}
