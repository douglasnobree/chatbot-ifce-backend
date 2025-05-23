import { ApiProperty } from '@nestjs/swagger';

export class MenuResponseDto {
  @ApiProperty({
    example: 'Menu principal',
    description: 'Título do menu',
  })
  title?: string;

  @ApiProperty({
    example: 'Escolha uma opção abaixo:',
    description: 'Texto de introdução do menu',
  })
  text: string;

  @ApiProperty({
    example: ['1 - Opção 1', '2 - Opção 2'],
    description: 'Lista de opções disponíveis no menu',
  })
  options?: string[];
}

export class ProtocoloDto {
  @ApiProperty({
    example: '123456',
    description: 'Número do protocolo gerado',
  })
  numero: string;

  @ApiProperty({
    example: 'Secretaria',
    description: 'Setor para o qual o atendimento será direcionado',
  })
  setor: string;
}

export class UserDataRequestDto {
  @ApiProperty({
    example: '12345678910',
    description: 'CPF do usuário',
  })
  cpf: string;

  @ApiProperty({
    example: '1234',
    description: 'Últimos 4 dígitos do telefone do usuário',
  })
  telefone: string;
}
