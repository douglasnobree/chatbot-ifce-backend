import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  /**
   * Armazena uma mensagem recebida ou enviada
   */
  async saveMessage(
    userId: string,
    conteudo: string,
    origem: 'USUARIO' | 'BOT',
  ): Promise<void> {
    try {
      await this.sessionRepository.saveMessage(userId, conteudo, origem);
    } catch (error) {
      this.logger.error(
        `Erro ao salvar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Obtém o contexto da conversa (últimas mensagens)
   */
  async getSessionContext(userId: string, limit: number = 10): Promise<string> {
    return await this.sessionRepository.getSessionContext(userId, limit);
  }
}
