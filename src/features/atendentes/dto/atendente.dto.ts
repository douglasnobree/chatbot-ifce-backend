import {
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidEmailDomain } from '../../../common/validators/email-domain.validator';

export class CreateAtendenteDto {
  @ApiProperty({
    description: 'Nome completo do atendente',
    example: 'João da Silva',
  })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;
  @ApiProperty({
    description: 'Email institucional do IFCE',
    example: 'joao.silva@ifce.edu.br',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  @IsValidEmailDomain()
  email: string;
  @ApiProperty({
    description: 'Cargo do atendente na instituição',
    example: 'Assistente Administrativo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cargo deve ser uma string' })
  cargo?: string;

  @ApiProperty({
    description: 'Departamento do atendente',
    example: 'Secretaria Acadêmica',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Departamento deve ser uma string' })
  departamento?: string;
}

export class UpdateAtendenteDto {
  @ApiProperty({
    description: 'Nome completo do atendente',
    example: 'João da Silva Santos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'Cargo do atendente na instituição',
    example: 'Coordenador',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cargo deve ser uma string' })
  cargo?: string;

  @ApiProperty({
    description: 'Departamento do atendente',
    example: 'Coordenação de Curso',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Departamento deve ser uma string' })
  departamento?: string;
}
