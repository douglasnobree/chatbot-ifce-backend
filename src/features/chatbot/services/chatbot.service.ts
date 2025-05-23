// filepath: c:\dev\chatbot-ifce-backend\src\features\chatbot\services\chatbot.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { Session, SessionState } from '../entities/session.entity';
import { WhatsappService } from '../../whatsapp/service/whatsapp.service';
import { SendMessageDto } from '../../whatsapp/dto/send-message.dto';
import { Cron } from '@nestjs/schedule';
import { MessageService } from './message.service';
import { UserDataService } from './user-data.service';
import { WhatsAppSessionService } from './whatsapp-session.service';
import { HandlersFactory } from './handlers-factory.service';
import { OperacoesBaseService } from './operacoes-base.service';
import { EstatisticasService } from './estatisticas-db.service';
import { NotificacoesService } from './notificacoes.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly whatsappService: WhatsappService,
    private readonly messageService: MessageService,
    private readonly userDataService: UserDataService,
    private readonly whatsAppSessionService: WhatsAppSessionService,
    private readonly handlersFactory: HandlersFactory,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly estatisticasService: EstatisticasService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Processa uma mensagem recebida do usuário
   * @param remetente ID do remetente (número de telefone ou grupo)
   * @param mensagem Texto da mensagem
   * @param instanceId ID da instância WhatsApp
   * @param mensagemOriginal Opcional - mensagem original se for uma resposta
   */
  async processMessage(
    remetente: string,
    mensagem: string,
    instanceId: string | number,
    mensagemOriginal?: string,
  ): Promise<void> {
    // Converte instanceId para string se for número
    const instanceIdStr = instanceId.toString();
    try {
      // Obtém ou cria a sessão do usuário
      const { InstanceName } =
        await this.whatsAppSessionService.getSessionNameById(
          Number(instanceId),
        );
      const session = await this.sessionService.getOrCreateSession(
        remetente,
        InstanceName,
      );

      // Verifica se é uma nova sessão para registrar estatísticas
      if (
        session.state === SessionState.MAIN_MENU &&
        session.lastInteractionTime === Date.now()
      ) {
        this.estatisticasService.registrarNovaSessao();
      }

      this.logger.log(
        `Processando mensagem do usuário ${remetente} no estado ${session.state}`,
      );

      // Se for uma resposta a outra mensagem, registramos isso no log
      if (mensagemOriginal) {
        this.logger.log(`Mensagem é uma resposta a: "${mensagemOriginal}"`);

        // Armazena a mensagem original na sessão para contexto
        await this.userDataService.updateUserData(remetente, {
          lastQuotedMessage: mensagemOriginal,
        });
      }

      // Salva a mensagem recebida no banco de dados
      await this.messageService.saveMessage(remetente, mensagem, 'USUARIO');

      // Processa a mensagem com base no estado atual da sessão
      await this.processarMensagemPorEstado(session, mensagem);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Processa a mensagem com base no estado atual da sessão
   */ private async processarMensagemPorEstado(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    try {
      // Registra o acesso ao estado atual para estatísticas
      this.estatisticasService.registrarAcessoMenu(session.state);

      // Se o estado for ENCERRAMENTO ou EXPIRED, exibe o menu principal
      if (
        session.state === SessionState.ENCERRAMENTO ||
        session.state === SessionState.EXPIRED
      ) {
        // Para sessões novas ou expiradas, envia mensagem de boas-vindas
        const isReturningUser = session.state === SessionState.ENCERRAMENTO;
        await this.notificacoesService.enviarMensagemBoasVindas(
          session,
          isReturningUser,
        );

        await this.operacoesBaseService.exibirMenuPrincipal(session);
        return;
      }

      // Obtém o handler adequado para o estado atual
      const handler = this.handlersFactory.getHandler(session.state);

      // Processa a mensagem usando o handler
      await handler.processarMensagem(session, mensagem);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem por estado: ${error.message}`,
        error.stack,
      );
      // Em caso de erro, volta para o menu principal
      await this.operacoesBaseService.exibirMenuPrincipal(session);
    }
  }

  /**
   * Tarefa cron para limpar sessões expiradas periodicamente
   */
  @Cron('0 */1 * * * *') // Executa a cada minuto
  async handleSessionCleanup() {
    this.logger.debug('Executando limpeza de sessões expiradas');
    const cleanedSessions = await this.sessionService.cleanExpiredSessions();

    if (cleanedSessions > 0) {
      this.logger.log(`${cleanedSessions} sessões expiradas foram limpas`);
    }
  }
}
