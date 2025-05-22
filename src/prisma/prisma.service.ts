import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }
  async onModuleInit() {
    try {
      this.logger.log('Conectando ao banco de dados...');
      await this.$connect();
      this.logger.log('Conexão com o banco de dados estabelecida com sucesso');
    } catch (error) {
      this.logger.error(`Erro ao conectar ao banco de dados: ${error.message}`);
      this.logger.error(
        'Verifique se o PostgreSQL está em execução e se as credenciais no .env estão corretas',
      );

      // Não vamos lançar o erro, para permitir que a aplicação continue
      // mesmo sem banco de dados (com fallback em memória)
    }
  }

  async onModuleDestroy() {
    this.logger.log('Desconectando do banco de dados...');
    await this.$disconnect();
  }
}
