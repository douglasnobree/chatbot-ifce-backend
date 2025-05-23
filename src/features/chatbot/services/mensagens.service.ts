import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../../whatsapp/service/whatsapp.service';
import { SendMessageDto } from '../../whatsapp/dto/send-message.dto';
import { MessageService } from './message.service';
import { Sessao } from '@prisma/client';

@Injectable()
export class MensagensService {
  private readonly logger = new Logger(MensagensService.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Envia uma mensagem para o usuário
   * @param session Sessão do usuário
   * @param texto Texto a ser enviado
   */
  async enviarMensagem(session: Sessao, texto: string): Promise<void> {
    try {
      // Prepara os dados da mensagem
      const mensagem: SendMessageDto = {
        number: session.userId.split('@')[0], // Remove o sufixo @s.whatsapp.net
        textMessage: {
          text: texto,
        },
      };

      // Envia a mensagem
      await this.whatsappService.sendMessage(mensagem, session.instanceName);

      // Salva a mensagem no histórico
      await this.messageService.saveMessage(session.userId, texto, 'BOT');

      this.logger.log(`Mensagem enviada para ${session.userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
