import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WebhookEventTriggered } from './webhook-Triggered';
import { WebhookEventType } from '../enums/enum';
import { WhatsappMessageDto } from '../dto/whatsapp-message.dto';
import { WhatsappService } from 'src/features/whatsapp/service/whatsapp.service';
import { ChatbotService } from 'src/features/chatbot/services/chatbot.service';
import { Logger } from '@nestjs/common';

@EventsHandler(WebhookEventTriggered)
export class MessageEventHandler
  implements IEventHandler<WebhookEventTriggered>
{
  private readonly logger = new Logger(MessageEventHandler.name);

  constructor(
    private readonly whatsAppService: WhatsappService,
    private readonly chatbotService: ChatbotService,
  ) {}
  async handle(event: WebhookEventTriggered) {
    const { type, data } = event;
    this.logger.debug(`Webhook event triggered: ${type}`);

    try {
      if (type === WebhookEventType.MESSAGES_UPSERT) {
        this.logger.log('Message upserted:', data);
        await this.processarMensagemRecebida(data);
      }

      if (type === WebhookEventType.MESSAGES_UPDATE) {
        this.logger.log('Message updated:', data);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar evento webhook: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Processa uma mensagem recebida do WebHook
   */
  private async processarMensagemRecebida(data: any): Promise<void> {
    try {
      console.log('Processando mensagem recebida:', data);
      // Verificar se é um objeto conforme nossa estrutura atual
      if (!data || !data.keyRemoteJid) {
        // Formato antigo, verificar se têm mensagens
        if (!data.messages || data.messages.length === 0) {
          this.logger.debug('Nenhuma mensagem encontrada no evento');
          return;
        }

        // Processamento para formato antigo
        const mensagemWhatsapp = data.messages[0];
        console.log('teste', mensagemWhatsapp);
        // Ignora mensagens enviadas pelo próprio bot
        if (mensagemWhatsapp.key.fromMe === true) {
          this.logger.debug('Mensagem enviada pelo próprio bot, ignorando');
          return;
        }
        if (data.isGroup === true) {
          this.logger.debug('Mensagem enviada por grupo, ignorando');
          return;
        }

        // Extrai informações da mensagem no formato antigo
        const remetente = mensagemWhatsapp.key.remoteJid;
        const instance = data.instance;
        let textoMensagem = '';

        if (mensagemWhatsapp.message?.conversation) {
          textoMensagem = mensagemWhatsapp.message.conversation;
        } else if (mensagemWhatsapp.message?.extendedTextMessage?.text) {
          textoMensagem = mensagemWhatsapp.message.extendedTextMessage.text;
        } else {
          this.logger.debug('Formato de mensagem não suportado');
          return;
        }

        // Processar a mensagem
        if (textoMensagem && remetente) {
          this.logger.log(
            `Mensagem recebida de ${remetente}: ${textoMensagem}`,
          );
          await this.chatbotService.processMessage(
            remetente,
            textoMensagem,
            instance,
          );
        }
      } else {
        console.log('Novo formato de mensagem:', data.messageTimestamp);

        if (data.messageTimestamp) {
          const timestampMensagem = Number(data.messageTimestamp) * 1000; // Converter para milissegundos se estiver em segundos
          const dateNow = Date.now();
          const minutosEmMs = 3 * 60 * 1000; // 10 minutos em milissegundos

          if (dateNow - timestampMensagem > minutosEmMs) {
            this.logger.debug(
              `Mensagem ignorada por ser muito antiga (mais de 10 minutos): ${new Date(timestampMensagem).toISOString()}`,
            );
            return;
          }
        }
        // if(data.keyRemoteJid == '558596856795@s.whatsapp.net') {
        //   this.logger.debug('ana que mandou');
        //   return;
        // }
        if (data.keyFromMe === true) {
          this.logger.debug('Mensagem enviada pelo próprio bot, ignorando');
          return;
        }
        if (data.isGroup === true) {
          this.logger.debug('Mensagem enviada por grupo, ignorando');
          return;
        }

        // Extrai informações da mensagem
        const remetente = data.keyRemoteJid;
        const instance = data.instanceId.toString();

        // Verifica se a mensagem tem texto
        let textoMensagem: string = '';

        if (data.messageType === 'conversation') {
          // Formato de mensagem simples
          textoMensagem = data.content.text || data.content.conversation;
        } else if (data.messageType === 'extendedTextMessage') {
          // Formato de mensagem estendida
          textoMensagem = data.content.text;
        } else {
          // Outros tipos de mensagem
          this.logger.debug(
            `Formato de mensagem não suportado: ${data.messageType}`,
          );
          return;
        }

        // Se conseguiu extrair o texto, processa a mensagem
        if (textoMensagem && remetente) {
          this.logger.log(
            `Mensagem recebida de ${remetente}: ${textoMensagem}`,
          );

          // Verificar se é uma resposta a outra mensagem
          let mensagemOriginal: string = null;
          if (data.content?.contextInfo?.quotedMessage?.conversation) {
            mensagemOriginal =
              data.content.contextInfo.quotedMessage.conversation;
            this.logger.log(`Mensagem é uma resposta a: "${mensagemOriginal}"`);
          }
          console.log(
            'Resposta a:',
            mensagemOriginal,
            'Texto da mensagem:',
            textoMensagem,
            'Remetente:',
            remetente,
            'Instance:',
            instance,
          );
          // Repassa para o serviço de chatbot processar
          await this.chatbotService.processMessage(
            remetente,
            textoMensagem,
            instance,
            mensagemOriginal,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }
}
