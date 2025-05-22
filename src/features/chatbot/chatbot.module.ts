import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { ChatbotService } from './services/chatbot.service';
import { WhatsappService } from '../whatsapp/service/whatsapp.service';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    SessionService,
    ChatbotService,
    WhatsappService,
    SessionRepository,
  ],
  exports: [ChatbotService, SessionService],
})
export class ChatbotModule {}
