import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappController } from './features/whatsapp/controller/whatsapp.controller';
import { WhatsappService } from './features/whatsapp/service/whatsapp.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class AppModule {}
