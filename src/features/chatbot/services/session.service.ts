import { Injectable, Logger } from '@nestjs/common';
import { SessionState } from '@prisma/client';
import { SessionRepository } from '../repositories/session.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageService } from './message.service';
import { WhatsAppSessionService } from './whatsapp-session.service';
import { Sessao } from '@prisma/client';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos em milissegundos

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly whatsAppSessionService: WhatsAppSessionService,
  ) {}
  /**
   * Obtém uma sessão existente ou cria uma nova se não existir ou estiver expirada
   */ async getOrCreateSession(
    userId: string,
    instanceId: string,
  ): Promise<any> {
    try {
      // Busca uma sessão ativa no banco de dados ou cria uma nova
      // O repository foi modificado para retornar apenas sessões não expiradas
      const session = await this.sessionRepository.getOrCreateSession(
        userId,
        instanceId,
      );

      console.log('session in database', session);
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao obter/criar sessão: ${error.message}`,
        error.stack,
      );
      throw error; // Propaga o erro para ser tratado pelos chamadores
    }
  }

  /**
   * Atualiza o estado da sessão de um usuário
   */ async updateSessionState(
    userId: string,
    newState: SessionState,
  ): Promise<any> {
    try {
      // Atualiza no banco de dados
      const session = await this.sessionRepository.updateSessionState(
        userId,
        newState,
      );

      this.logger.log(
        `Estado da sessão do usuário ${userId} atualizado para ${newState}`,
      );
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar estado da sessão: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Define se o chatbot está esperando uma resposta do usuário
   */ async setEsperandoResposta(
    userId: string,
    esperando: boolean,
  ): Promise<void> {
    try {
      // Busca a sessão ativa mais recente do usuário
      const session = await this.sessionRepository.getLatestSession(userId);
      if (session) {
        // Atualiza a flag esperando_resposta no banco de dados
        await this.prisma.sessao.update({
          where: { id: session.id },
          data: { esperando_resposta: esperando },
        });
      }
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar flag esperandoResposta: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Encerra uma sessão de usuário
   */ async encerrarSessao(userId: string): Promise<void> {
    try {
      // Atualiza no banco de dados
      await this.sessionRepository.encerrarSessao(userId);
      this.logger.log(`Sessão do usuário ${userId} encerrada`);
    } catch (error) {
      this.logger.error(
        `Erro ao encerrar sessão: ${error.message}`,
        error.stack,
      );
    }
  }
  async getLatestSession(userId: string): Promise<any> {
    try {
      // Busca no banco de dados
      const session = await this.sessionRepository.getLatestSession(userId);
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao obter a última sessão: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Verifica e limpa sessões expiradas
   * @returns Número de sessões limpas
   */ async cleanExpiredSessions(): Promise<number> {
    try {
      // Marca sessões expiradas no banco de dados (não deleta)
      // Importante: Não alteramos sessões que já estão marcadas como EXPIRED
      const now = Date.now();
      const result = await this.prisma.sessao.updateMany({
        where: {
          ultima_interacao: {
            lt: new Date(now - this.SESSION_TIMEOUT),
          },
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        data: {
          estado: SessionState.EXPIRED,
        },
      });

      const updatedCount = result.count;
      if (updatedCount > 0) {
        this.logger.log(
          `${updatedCount} sessões foram marcadas como expiradas no banco de dados`,
        );
      }

      // Sessões mais antigas (24 horas) também são marcadas como expiradas pelo repository
      const dbExpiredCount =
        await this.sessionRepository.cleanExpiredSessions();

      return updatedCount + dbExpiredCount;
    } catch (error) {
      this.logger.error(
        `Erro ao marcar sessões expiradas: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Obtém o estado atual da sessão do WhatsApp
   * @deprecated Use WhatsAppSessionService.getSessionWhatsAppCurrentState instead
   */
  async getSessionWhatsAppCurrentState() {
    return this.whatsAppSessionService.getSessionWhatsAppCurrentState();
  }
  /**
   * Obtém o nome da sessão pelo ID
   * @deprecated Use WhatsAppSessionService.getSessionNameById instead
   */
  async getSessionNameById(id: number) {
    return this.whatsAppSessionService.getSessionNameById(id);
  }
  /**
   * Obtém o contexto da conversa (últimas mensagens)
   * @deprecated Use MessageService.getSessionContext instead
   */
  async getSessionContext(userId: string, limit: number = 10): Promise<string> {
    return this.messageService.getSessionContext(userId, limit);
  }
}
