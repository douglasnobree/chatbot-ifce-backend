import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { MensagensService } from './mensagens.service';
import { MenuTexts } from '../constants/menu-texts';
import { Sessao, SessionState } from '@prisma/client';

@Injectable()
export class OperacoesBaseService {
  private readonly logger = new Logger(OperacoesBaseService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly mensagensService: MensagensService,
  ) {}

  /**
   * Encerra o atendimento do usuário
   */
  async encerrarAtendimento(session: Sessao): Promise<void> {
    await this.sessionService.updateSessionState(
      session.userId,
      SessionState.ENCERRAMENTO,
    );

    await this.mensagensService.enviarMensagem(session, MenuTexts.ENCERRAMENTO);

    // Limpa a sessão após encerrar o atendimento
    await this.sessionService.encerrarSessao(session.userId);
  }

  /**
   * Volta para o menu principal
   */
  async voltarMenuPrincipal(session: Sessao): Promise<void> {
    await this.sessionService.updateSessionState(
      session.userId,
      SessionState.MAIN_MENU,
    );
    await this.exibirMenuPrincipal(session);
  }

  /**
   * Exibe o menu principal
   */
  async exibirMenuPrincipal(session: Sessao): Promise<void> {
    // Atualiza o estado da sessão
    await this.sessionService.updateSessionState(
      session.userId,
      SessionState.MAIN_MENU,
    );

    // Envia a mensagem do menu principal
    await this.mensagensService.enviarMensagem(session, MenuTexts.MAIN_MENU);
  }

  /**
   * Exibe uma mensagem de opção inválida e em seguida o menu especificado
   */
  async exibirOpcaoInvalida(
    session: Sessao,
    exibirMenu: () => Promise<void>,
  ): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.OPCAO_INVALIDA,
    );
    await exibirMenu();
  }
}
