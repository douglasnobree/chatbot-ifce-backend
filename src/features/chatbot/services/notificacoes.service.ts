import { Injectable, Logger } from '@nestjs/common';
import { MensagensService } from './mensagens.service';
import { SessionService } from './session.service';
import { Sessao } from '@prisma/client';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    private readonly mensagensService: MensagensService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Envia uma notificação de lembrete para o usuário
   * @param session Sessão do usuário
   * @param mensagem Mensagem do lembrete
   */
  async enviarLembrete(session: Sessao, mensagem: string): Promise<void> {
    try {
      await this.mensagensService.enviarMensagem(
        session,
        `⏰ Lembrete: ${mensagem}`,
      );

      this.logger.log(`Lembrete enviado para usuário ${session.userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar lembrete: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Envia uma notificação de atualização de processo
   * @param userId ID do usuário
   * @param numeroProtocolo Número do protocolo atualizado
   * @param mensagem Mensagem de atualização
   */
  async notificarAtualizacaoProcesso(
    userId: string,
    numeroProtocolo: string,
    mensagem: string,
  ): Promise<void> {
    try {
      // Recupera a sessão do usuário
      const session = await this.sessionService.getLatestSession(userId);

      if (session) {
        await this.mensagensService.enviarMensagem(
          session,
          `📣 Atualização do Protocolo #${numeroProtocolo}:\n\n${mensagem}`,
        );

        this.logger.log(
          `Notificação de atualização de processo enviada para usuário ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao notificar atualização de processo: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Envia uma mensagem de boas-vindas quando o usuário inicia uma nova sessão
   * @param session Sessão do usuário
   * @param isReturningUser Se é um usuário que já usou o sistema antes
   */
  async enviarMensagemBoasVindas(
    session: Sessao,
    isReturningUser: boolean,
  ): Promise<void> {
    try {
      let mensagem: string;

      if (isReturningUser) {
        mensagem = `👋 Olá novamente, Bem-vindo(a) de volta ao atendimento virtual do IFCE Campus Tabuleiro do Norte.`;
      } else {
        mensagem = `👋 Olá! Bem-vindo(a) ao atendimento virtual do IFCE Campus Tabuleiro do Norte.`;
      }

      await this.mensagensService.enviarMensagem(session, mensagem);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem de boas-vindas: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Envia uma mensagem de inatividade quando o usuário fica muito tempo sem interagir
   * @param session Sessão do usuário
   */
  async enviarMensagemInatividade(session: Sessao): Promise<void> {
    try {
      await this.mensagensService.enviarMensagem(
        session,
        `Notei que você está inativo há algum tempo. Ainda posso ajudar com algo? Digite uma opção ou "0" para voltar ao menu principal.`,
      );

      this.logger.log(`Mensagem de inatividade enviada para ${session.userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem de inatividade: ${error.message}`,
        error.stack,
      );
    }
  }
  
}
