import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappController } from './features/whatsapp/controller/whatsapp.controller';
import { WhatsappService } from './features/whatsapp/service/whatsapp.service';
import { WebhookModule } from './features/webhook/webhook.module';
import { AuthModule } from './features/auth/auth.module';
import { ChatbotModule } from './features/chatbot/chatbot.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CqrsModule,
    ScheduleModule.forRoot(),
    WebhookModule,
    AuthModule,
    ChatbotModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class AppModule {}
