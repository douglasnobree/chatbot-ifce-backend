import { ApiProperty } from '@nestjs/swagger';

export class MessageOptionsDto {
  @ApiProperty({
    example: null,
    description: 'Atributos externos opcionais',
    required: false,
  })
  externalAttributes?: any;

  @ApiProperty({
    example: 1200,
    description: 'Delay em milissegundos',
    required: false,
  })
  delay?: number;

  @ApiProperty({
    example: 'composing',
    description: 'Status de presença',
    required: false,
  })
  presence?: string;
}

export class TextMessageDto {
  @ApiProperty({
    example: 'Olá, tudo bem?',
    description: 'Texto da mensagem',
  })
  text: string;
}

export class SendMessageDto {
  @ApiProperty({
    example: '5588999999999',
    description: 'Número de destino no formato internacional',
  })
  number: string;

  @ApiProperty({
    type: MessageOptionsDto,
    description: 'Opções de envio da mensagem',
    required: false,
  })
  options?: MessageOptionsDto;

  @ApiProperty({
    type: TextMessageDto,
    description: 'Mensagem de texto a ser enviada',
  })
  textMessage: TextMessageDto;
}
