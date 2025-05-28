export class Atendente {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  criado_em: Date;
  atualizado_em: Date;
}

export class CreateAtendenteDto {
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
}

export class UpdateAtendenteDto {
  nome?: string;
  cargo?: string;
  departamento?: string;
}
