import { ApiProperty } from '@nestjs/swagger';

class AuthDto {
  @ApiProperty({ example: 4, description: 'ID da autenticação' })
  id: number;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de autenticação',
  })
  token: string;
}

export class InstanceResponseCreateDto {
  @ApiProperty({ example: 4, description: 'ID da instância' })
  id: number;

  @ApiProperty({ example: 'IFCE-Chat', description: 'Nome da instância' })
  name: string;

  @ApiProperty({ example: 'Testando', description: 'Descrição da instância' })
  description: string;

  @ApiProperty({
    example: '2025-05-22T21:37:38.624Z',
    description: 'Data de criação no formato ISO',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-05-22T21:37:38.624Z',
    description: 'Data da última atualização no formato ISO',
  })
  updatedAt: Date;

  @ApiProperty({ type: AuthDto, description: 'Dados de autenticação' })
  Auth: AuthDto;
}
