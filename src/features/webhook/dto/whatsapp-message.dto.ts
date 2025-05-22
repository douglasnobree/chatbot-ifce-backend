import { ApiProperty } from '@nestjs/swagger';

export class QuotedMessageDto {
  @ApiProperty({ example: 'to arrumando os milhoes de projeto q tem q fzr ja' })
  conversation?: string;
}

export class ContextInfoDto {
  @ApiProperty({ example: '3EB0466A91EE108277E724' })
  stanzaId?: string;

  @ApiProperty({ example: '558881134131@s.whatsapp.net' })
  participant?: string;

  @ApiProperty({ type: QuotedMessageDto })
  quotedMessage?: QuotedMessageDto;
}

export class MessageContentDto {
  @ApiProperty({
    example: 'chama',
    description: 'Texto da mensagem',
  })
  text?: string;

  @ApiProperty({
    example: 'a',
    description: 'Texto da mensagem em formato de conversa',
  })
  conversation?: string;

  @ApiProperty({
    example: 'NONE',
    description: 'Tipo de preview',
    required: false,
  })
  previewType?: string;

  @ApiProperty({ type: ContextInfoDto, required: false })
  contextInfo?: ContextInfoDto;

  @ApiProperty({ example: 'DEFAULT', required: false })
  inviteLinkGroupTypeV2?: string;
}

export class MessageInfoDto {
  @ApiProperty({ example: 'notify' })
  type: string;
}

export class WhatsappMessageDto {
  @ApiProperty({ example: '744E386286D1429E8D1D4F68CD0ADF31' })
  keyId: string;

  @ApiProperty({ example: '558596853395@s.whatsapp.net' })
  keyRemoteJid: string;

  @ApiProperty({ example: false })
  keyFromMe: boolean;

  @ApiProperty({ example: 'Chico Coco' })
  pushName: string;

  @ApiProperty({
    example: 'extendedTextMessage',
    description: 'Tipo da mensagem (extendedTextMessage, conversation, etc)',
    enum: [
      'extendedTextMessage',
      'conversation',
      'imageMessage',
      'documentMessage',
      'audioMessage',
      'videoMessage',
    ],
  })
  messageType: string;

  @ApiProperty({ type: MessageContentDto })
  content: MessageContentDto;

  @ApiProperty({ example: 1747951801 })
  messageTimestamp: number;

  @ApiProperty({ example: 6 })
  instanceId: number;

  @ApiProperty({ example: 'android', enum: ['android', 'web', 'ios'] })
  device: string;

  @ApiProperty({ example: false })
  isGroup: boolean;

  @ApiProperty({ example: 498246 })
  id: number;

  @ApiProperty({ type: MessageInfoDto })
  info: MessageInfoDto;
}
