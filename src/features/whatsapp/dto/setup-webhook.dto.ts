import { ApiProperty } from '@nestjs/swagger';


export class SetupWebhookDto {
  @ApiProperty({
    description: 'URL para onde serão enviados os eventos do webhook',
    example: 'https://seu-servidor.com/webhook',
  })
  url: string;
}
