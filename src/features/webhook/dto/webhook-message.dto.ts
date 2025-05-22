import { ApiProperty } from '@nestjs/swagger';

/**
 * Mensagem citada em uma resposta
 */
export class QuotedMessageDto {
  @ApiProperty({
    example: 'to arrumando os milhoes de projeto q tem q fzr ja',
    description: 'Texto da mensagem original que foi respondida',
  })
  conversation?: string;
}

/**
 * Informações de contexto da mensagem
 */
export class MessageContextInfoDto {
  @ApiProperty({
    example: '3EB0466A91EE108277E724',
    description: 'ID da mensagem no formato Stanza',
  })
  stanzaId?: string;

  @ApiProperty({
    example: '558881134131@s.whatsapp.net',
    description: 'ID do participante que enviou a mensagem original',
  })
  participant?: string;

  @ApiProperty({
    type: QuotedMessageDto,
    description: 'Mensagem citada quando é uma resposta',
  })
  quotedMessage?: QuotedMessageDto;
}

/**
 * Conteúdo da mensagem (pode ser texto simples ou estendido)
 */
export class MessageContentDto {
  @ApiProperty({
    example: 'ea ai chapa',
    description: 'Texto da mensagem (formato extendedTextMessage)',
  })
  text?: string;

  @ApiProperty({
    example: 'olá, como vai?',
    description: 'Texto da mensagem (formato conversation)',
  })
  conversation?: string;

  @ApiProperty({
    example: 'NONE',
    description: 'Tipo de preview',
    required: false,
  })
  previewType?: string;

  @ApiProperty({
    type: MessageContextInfoDto,
    description: 'Informações de contexto da mensagem',
    required: false,
  })
  contextInfo?: MessageContextInfoDto;

  @ApiProperty({
    example: 'DEFAULT',
    description: 'Tipo de link de convite para grupo',
    required: false,
  })
  inviteLinkGroupTypeV2?: string;
}

/**
 * Informações adicionais sobre a mensagem
 */
export class MessageInfoDto {
  @ApiProperty({
    example: 'notify',
    description: 'Tipo de informação da mensagem',
  })
  type: string;
}

/**
 * DTO principal que representa uma mensagem do WhatsApp
 * Compatível com os dois formatos identificados
 */
export class WebhookMessageDto {
  @ApiProperty({
    example: '744E386286D1429E8D1D4F68CD0ADF31',
    description: 'ID único da mensagem',
  })
  keyId: string;

  @ApiProperty({
    example: '5583396856795@s.whatsapp.net',
    description: 'ID do remetente ou grupo',
  })
  keyRemoteJid: string;

  @ApiProperty({
    example: false,
    description: 'Indica se a mensagem foi enviada pelo próprio bot',
  })
  keyFromMe: boolean;

  @ApiProperty({
    example: 'Chico Coco',
    description: 'Nome do remetente',
  })
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

  @ApiProperty({
    type: MessageContentDto,
    description: 'Conteúdo da mensagem',
  })
  content: MessageContentDto;

  @ApiProperty({
    example: 1747951801,
    description: 'Timestamp de quando a mensagem foi enviada',
  })
  messageTimestamp: number;

  @ApiProperty({
    example: 6,
    description: 'ID da instância do WhatsApp que recebeu a mensagem',
  })
  instanceId: number;

  @ApiProperty({
    example: 'android',
    enum: ['android', 'web', 'ios'],
    description: 'Dispositivo de origem da mensagem',
  })
  device: string;

  @ApiProperty({
    example: false,
    description: 'Indica se a mensagem foi enviada em um grupo',
  })
  isGroup: boolean;

  @ApiProperty({
    example: 498246,
    description: 'ID numérico da mensagem',
  })
  id: number;

  @ApiProperty({
    type: MessageInfoDto,
    description: 'Informações adicionais sobre a mensagem',
  })
  info: MessageInfoDto;
}
