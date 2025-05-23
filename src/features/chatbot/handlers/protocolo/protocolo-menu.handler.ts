import { Injectable } from '@nestjs/common';
import { SessionState } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { SessionService } from '../../services';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { MenuTexts } from '../../constants/menu-texts';
import { Sessao } from '@prisma/client';

@Injectable()
export class ProtocoloMenuHandler implements MenuHandler {
  constructor(
    private readonly sessionService: SessionService,
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  /**
   * Exibe o menu de protocolo
   */
  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.PROTOCOLO_MENU,
    );
  }

  /**
   * Processa a interação do usuário com o menu de protocolo
   */
  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    const msgNormalizada = mensagem.trim().toLowerCase();

    switch (msgNormalizada) {
      case '1':
        // Consultar número de matrícula
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.CONSULTAR_MATRICULA,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.CONSULTA_MATRICULA,
        );

        // Atualizando o estado para esperar o CPF e telefone
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.ESPERANDO_CPF_TELEFONE,
        );
        break;

      case '2':
        // Trancamento ou reabertura de curso
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.TRANCAMENTO_REABERTURA,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.TRANCAMENTO_REABERTURA,
        );
        break;

      case '3':
        // Emitir documentos
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.EMITIR_DOCUMENTOS,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.EMITIR_DOCUMENTOS,
        );
        break;

      case '4':
        // Justificar faltas
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.JUSTIFICAR_FALTAS,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.JUSTIFICAR_FALTAS,
        );
        break;

      case '5':
        // Acompanhar andamento de processos
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.ACOMPANHAR_PROCESSOS,
        );
        await this.mensagensService.enviarMensagem(
          session,
          MenuTexts.ACOMPANHAR_PROCESSOS,
        );
        break;

      case '0':
        // Voltar ao menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      default:
        // Opção inválida
        await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
          this.exibirMenu(session),
        );
    }
  }
}
