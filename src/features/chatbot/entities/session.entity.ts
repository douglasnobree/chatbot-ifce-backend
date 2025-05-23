import { ApiProperty } from '@nestjs/swagger';

export enum SessionState {
  // Estados principais de navegação
  MAIN_MENU = 'MAIN_MENU',
  PROTOCOLO_MENU = 'PROTOCOLO_MENU',
  CONSULTAR_MATRICULA = 'CONSULTAR_MATRICULA',
  ASSISTENCIA_ESTUDANTIL = 'ASSISTENCIA_ESTUDANTIL',
  CURSOS_INGRESSO = 'CURSOS_INGRESSO',
  COMUNICACAO_SETORES = 'COMUNICACAO_SETORES',

  // Estados de processamento de consulta
  ESPERANDO_CPF_TELEFONE = 'ESPERANDO_CPF_TELEFONE',
  RESULTADO_CONSULTA = 'RESULTADO_CONSULTA',

  // Estados de protocolo
  TRANCAMENTO_REABERTURA = 'TRANCAMENTO_REABERTURA',
  EMITIR_DOCUMENTOS = 'EMITIR_DOCUMENTOS',
  JUSTIFICAR_FALTAS = 'JUSTIFICAR_FALTAS',
  ACOMPANHAR_PROCESSOS = 'ACOMPANHAR_PROCESSOS',
  CONSULTANDO_PROTOCOLO = 'CONSULTANDO_PROTOCOLO',
  REGISTRO_DOCUMENTO_PENDENTE = 'REGISTRO_DOCUMENTO_PENDENTE',

  // Estados para outras funcionalidades
  AGUARDANDO_RESPOSTA_SETOR = 'AGUARDANDO_RESPOSTA_SETOR',
  ATENDIMENTO_HUMANO = 'ATENDIMENTO_HUMANO',

  // Estados de sistema/controle
  ENCERRAMENTO = 'ENCERRAMENTO',
  EXPIRED = 'EXPIRED',
}

export class UserData {
  @ApiProperty({ example: '12345678910' })
  cpf?: string;

  @ApiProperty({ example: '1234' })
  telefone?: string;

  @ApiProperty({ example: 'João Silva' })
  nome?: string;

  @ApiProperty({ example: 'Análise e Desenvolvimento de Sistemas' })
  curso?: string;

  @ApiProperty({ example: '2023123456' })
  matricula?: string;

  @ApiProperty({
    example: 'to arrumando os milhoes de projeto q tem q fzr ja',
    description: 'Mensagem original quando o usuário responde a uma mensagem',
  })
  lastQuotedMessage?: string;

  @ApiProperty({
    example: 'Secretaria',
    description: 'Setor escolhido para comunicação',
  })
  escolhaSetor?: string;
}

export class AtendenteDados {
  @ApiProperty({ example: '12345' })
  id?: string;

  @ApiProperty({ example: 'Maria Souza' })
  nome?: string;

  @ApiProperty({ example: 'maria.souza@ifce.edu.br' })
  email?: string;
}

export class Session {
  @ApiProperty({ example: '558899999999@s.whatsapp.net' })
  userId: string;

  @ApiProperty({ example: 'MAIN_MENU', enum: SessionState })
  state: SessionState;

  @ApiProperty({ type: UserData })
  userData: UserData;

  @ApiProperty({ type: AtendenteDados })
  atendente?: AtendenteDados;

  @ApiProperty({ example: 1610000000000 })
  lastInteractionTime: number;

  @ApiProperty({ example: 'instance-123' })
  instanceId: string;

  @ApiProperty({ example: false })
  esperandoResposta: boolean;
}
