import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAtendenteDto, UpdateAtendenteDto } from '../dto/atendente.dto';
import { Atendente } from '@prisma/client';

@Injectable()
export class AtendentesService {
  private readonly logger = new Logger(AtendentesService.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Valida se o email é de um domínio válido do IFCE
   */
  private validateIfceEmail(email: string): boolean {
    const isDevelopment =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

    let validDomains = ['@ifce.edu.br'];

    // Em desenvolvimento, permite também emails de alunos
    if (isDevelopment) {
      validDomains.push('@aluno.ifce.edu.br');
      this.logger.log(
        'Modo desenvolvimento: permitindo emails @aluno.ifce.edu.br',
      );
    }

    return validDomains.some((domain) => email.toLowerCase().endsWith(domain));
  }

  /**
   * Cria um novo atendente
   */
  async create(createAtendenteDto: CreateAtendenteDto): Promise<Atendente> {
    try {
      // Validação adicional do domínio
      if (!this.validateIfceEmail(createAtendenteDto.email)) {
        throw new BadRequestException(
          'Email deve ser do domínio @ifce.edu.br ou @aluno.ifce.edu.br',
        );
      }

      // Verifica se já existe um atendente com o mesmo email
      const existingAtendente = await this.prisma.atendente.findUnique({
        where: { email: createAtendenteDto.email.toLowerCase() },
      });

      if (existingAtendente) {
        throw new ConflictException('Já existe um atendente com este email');
      }

      const atendente = await this.prisma.atendente.create({
        data: {
          ...createAtendenteDto,
          email: createAtendenteDto.email.toLowerCase(),
        },
      });

      this.logger.log(
        `Atendente criado: ${atendente.nome} (${atendente.email})`,
      );
      return atendente;
    } catch (error) {
      this.logger.error(`Erro ao criar atendente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca todos os atendentes
   */
  async findAll(): Promise<Atendente[]> {
    try {
      return await this.prisma.atendente.findMany({
        orderBy: { criado_em: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar atendentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca um atendente por ID
   */
  async findOne(id: string): Promise<Atendente> {
    try {
      const atendente = await this.prisma.atendente.findUnique({
        where: { id },
        include: {
          sessoes: {
            select: {
              id: true,
              userId: true,
              estado: true,
              ultima_interacao: true,
            },
            orderBy: { ultima_interacao: 'desc' },
            take: 10,
          },
          protocolos: {
            select: {
              id: true,
              numero: true,
              status: true,
              setor: true,
              data_criacao: true,
            },
            orderBy: { data_criacao: 'desc' },
            take: 10,
          },
        },
      });

      if (!atendente) {
        throw new NotFoundException('Atendente não encontrado');
      }

      return atendente;
    } catch (error) {
      this.logger.error(`Erro ao buscar atendente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca um atendente por email
   */
  async findByEmail(email: string): Promise<Atendente | null> {
    try {
      return await this.prisma.atendente.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar atendente por email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um atendente
   */
  async update(
    id: string,
    updateAtendenteDto: UpdateAtendenteDto,
  ): Promise<Atendente> {
    try {
      // Verifica se o atendente existe
      const existingAtendente = await this.findOne(id);

      const atendente = await this.prisma.atendente.update({
        where: { id },
        data: updateAtendenteDto,
      });

      this.logger.log(
        `Atendente atualizado: ${atendente.nome} (${atendente.email})`,
      );
      return atendente;
    } catch (error) {
      this.logger.error(`Erro ao atualizar atendente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um atendente
   */
  async remove(id: string): Promise<void> {
    try {
      // Verifica se o atendente existe
      await this.findOne(id);

      await this.prisma.atendente.delete({
        where: { id },
      });

      this.logger.log(`Atendente removido: ID ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao remover atendente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria ou atualiza um atendente baseado na autenticação Google
   */
  async createOrUpdateFromGoogleAuth(googleProfile: any): Promise<Atendente> {
    try {
      const email = googleProfile.emails[0].value.toLowerCase();
      const nome = `${googleProfile.name.givenName} ${googleProfile.name.familyName}`;

      // Valida se é um email válido do IFCE
      if (!this.validateIfceEmail(email)) {
        throw new BadRequestException(
          'Apenas emails do domínio @ifce.edu.br ou @aluno.ifce.edu.br podem ser cadastrados como atendentes',
        );
      }

      // Busca atendente existente
      let atendente = await this.findByEmail(email);

      if (atendente) {
        // Atualiza dados se necessário
        if (atendente.nome !== nome) {
          atendente = await this.update(atendente.id, { nome });
        }
      } else {
        // Cria novo atendente
        atendente = await this.create({
          nome,
          email,
          cargo: 'Atendente',
          departamento: 'Sistema',
        });
      }

      return atendente;
    } catch (error) {
      this.logger.error(
        `Erro ao criar/atualizar atendente do Google: ${error.message}`,
      );
      throw error;
    }
  }
}
