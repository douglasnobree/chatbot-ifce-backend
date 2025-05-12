import { ApiProperty } from '@nestjs/swagger';

export class WebhookMessageDto {
  @ApiProperty({ example: '50522878839DC26CEFB67491D7F4E911' })
  keyId: string;

  @ApiProperty({ example: '120363131954818558@g.us' })
  keyRemoteJid: string;

  @ApiProperty({ example: false })
  keyFromMe: boolean;

  @ApiProperty({ example: 'Fabrício' })
  pushName: string;

  @ApiProperty({ example: '558892556778@s.whatsapp.net' })
  keyParticipant: string;

  @ApiProperty({ example: 'extendedTextMessage' })
  messageType: string;

  @ApiProperty({
    example: {
      text: 'Oi',
      previewType: 'NONE',
      contextInfo: {
        stanzaId: '7F1D0BECA3D4FDB80E6152236F9CBBBE',
        participant: '5519936111982@s.whatsapp.net',
        quotedMessage: {
          conversation:
            'xxx xxx x xx x x x xxxx x xx .',
        },
      },
      inviteLinkGroupTypeV2: 'DEFAULT',
    },
  })
  content: {
    text: string;
    previewType: string;
    contextInfo: {
      stanzaId: string;
      participant: string;
      quotedMessage: {
        conversation: string;
      };
    };
    inviteLinkGroupTypeV2: string;
  };

  @ApiProperty({ example: 1737074605 })
  messageTimestamp: number;

  @ApiProperty({ example: 3 })
  instanceId: number;

  @ApiProperty({ example: 'android' })
  device: string;

  @ApiProperty({ example: true })
  isGroup: boolean;

  @ApiProperty({ example: { type: 'notify' } })
  info: { type: string };
}
