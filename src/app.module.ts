import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappController } from './features/whatsapp/controller/whatsapp.controller';
import { WhatsappService } from './features/whatsapp/service/whatsapp.service';
import { WebhookModule } from './features/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    ScheduleModule.forRoot(),
    WebhookModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class AppModule {}
