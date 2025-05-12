import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WebhookEventTriggered } from './webhook-Triggered';
import { WebhookEventType } from '../enums/enum';
import { WebhookMessageDto } from '../dto/web-hook-message.dto';
import { WhatsappService } from 'src/features/whatsapp/service/whatsapp.service';

import { Cron } from '@nestjs/schedule';

@EventsHandler(WebhookEventTriggered)
export class MessageEventHandler
  implements IEventHandler<WebhookEventTriggered>
{
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(private readonly whatsAppService: WhatsappService) {}

  async handle(event: WebhookEventTriggered) {
    const { type, data } = event;
    console.log('Webhook event triggered:', type, data);

    if (type === WebhookEventType.MESSAGES_UPSERT) {
      console.log('Received message:', data);
    }

    if (type === WebhookEventType.MESSAGES_UPDATE) {
      console.log('Message updated:', data);
    }
  }
}
