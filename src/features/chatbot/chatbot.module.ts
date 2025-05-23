import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { ChatbotService } from './services/chatbot.service';
import { WhatsappService } from '../whatsapp/service/whatsapp.service';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageService } from './services/message.service';
import { UserDataService } from './services/user-data.service';
import { WhatsAppSessionService } from './services/whatsapp-session.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SessionService,
    ChatbotService,
    WhatsappService,
    SessionRepository,
    MessageService,
    UserDataService,
    WhatsAppSessionService,
  ],
  exports: [
    ChatbotService,
    SessionService,
    MessageService,
    UserDataService,
    WhatsAppSessionService,
  ],
})
export class ChatbotModule {}
