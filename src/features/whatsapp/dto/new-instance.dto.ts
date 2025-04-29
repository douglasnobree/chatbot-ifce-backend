import { ApiProperty } from '@nestjs/swagger';

export class NewInstanceDto {
  @ApiProperty({
    example: 'codechat-bot',
    description: 'Nome da instância do WhatsApp',
  })
  instanceName: string;

  @ApiProperty({
    example: 'Instance: Test V1',
    description: 'Descrição da instância',
  })
  description: string;
}
