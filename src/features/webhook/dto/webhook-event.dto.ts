import { ApiProperty } from '@nestjs/swagger';
import { WebhookEventType } from '../enums/enum';

export class WebhookEventDto {
  @ApiProperty({
    enum: Object.values(WebhookEventType),
    description: 'Tipo do evento recebido do webhook',
    example: WebhookEventType.MESSAGES_UPSERT,
  })
  event: WebhookEventType;

  @ApiProperty({
    description: 'Dados do evento recebido',
    example: {
      message: {
        id: '123456789',
        body: 'Olá, como posso ajudar?',
        from: '5588999999999',
      },
    },
  })
  data: any;
}
