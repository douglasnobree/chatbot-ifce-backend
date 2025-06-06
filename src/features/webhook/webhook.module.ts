import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WebhookController } from './controllers/webhook.controller';
import { HandleWebhookEventCommandHandler } from './commands/handlewebhook.command';
import { MessageEventHandler } from './events/message-event';
import { WhatsappService } from '../whatsapp/service/whatsapp.service';
import { ChatbotModule } from '../chatbot/chatbot.module';

const CommandHandlers = [HandleWebhookEventCommandHandler];
const EventHandlers = [MessageEventHandler];

@Module({
  imports: [CqrsModule, ChatbotModule],
  controllers: [WebhookController],
  providers: [...CommandHandlers, ...EventHandlers, WhatsappService],
  exports: [],
})
export class WebhookModule {}
