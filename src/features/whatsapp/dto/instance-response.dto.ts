import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventsDto {
  @ApiProperty({ example: false })
  chatsSet: boolean;

  @ApiProperty({ example: true })
  chatsUpsert: boolean;

  @ApiProperty({ example: true })
  contactsSet: boolean;

  // ...outros eventos
}

export class WebhookDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: false })
  enabled: boolean;

  @ApiProperty({
    example: 'https://webhook.site/1d859ca6-97b9-49c8-9d5a-3f561d6abb4e',
  })
  url: string;

  @ApiProperty({ type: WebhookEventsDto })
  events: WebhookEventsDto;

  @ApiProperty({ example: '2024-08-28T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-08-29T18:04:21.968Z' })
  updatedAt: string;
}

export class WhatsappConnectionDto {
  @ApiProperty({ example: 'open' })
  state: string;

  @ApiProperty({ example: 200 })
  statusReason: number;
}

export class WhatsappDto {
  @ApiProperty({ type: WhatsappConnectionDto })
  connection: WhatsappConnectionDto;
}

export class QrCodeConnectionDTO{
  @ApiProperty({ example: 1, required: false })
  count?: number;

  @ApiProperty({ example: 'data:image/png;base64,...', required: false })
  base64?: string;

  @ApiProperty({
    example: '2@WWDFM7QHaSH7i0BQQv12dUluv7PFYo ...',
    required: false,
  })
  code?: string;
}

export class InstanceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'codechat' })
  name: string;

  @ApiProperty({ example: 'Instance: Test V1' })
  description: string;

  @ApiProperty({ example: 'ONLINE' })
  connectionStatus: string;

  @ApiProperty({ example: '123@s.whatsapp.net' })
  ownerJid: string;

  @ApiProperty({ example: 'https://pps.whatsapp.net/v/t61.24694-24/...' })
  profilePicUrl: string;

  @ApiProperty({ example: '2024-08-28T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-08-30T12:51:55.745Z' })
  updatedAt: string;

  @ApiProperty({ type: WebhookDto })
  Webhook: WebhookDto;

  @ApiProperty({ type: WhatsappDto })
  Whatsapp: WhatsappDto;

  @ApiProperty({ type: QrCodeConnectionDTO })
  qrCodeConnection: QrCodeConnectionDTO;
  
}
