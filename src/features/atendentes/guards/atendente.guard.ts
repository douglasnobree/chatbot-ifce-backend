import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AtendenteGuard implements CanActivate {
  private readonly logger = new Logger(AtendenteGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      this.logger.warn('Tentativa de acesso sem usuário autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    try {
      // Verifica se o usuário é um atendente válido
      const atendente = await this.prisma.atendente.findUnique({
        where: { email: user.email.toLowerCase() },
      });

      if (!atendente) {
        this.logger.warn(
          `Acesso negado para usuário não-atendente: ${user.email}`,
        );
        throw new ForbiddenException(
          'Acesso negado. Apenas atendentes cadastrados podem acessar esta funcionalidade.',
        );
      }

      // Adiciona informações do atendente ao request para uso posterior
      request.atendente = atendente;

      this.logger.log(
        `Acesso autorizado para atendente: ${atendente.nome} (${atendente.email})`,
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Erro ao verificar permissões de atendente: ${error.message}`,
      );
      throw new ForbiddenException('Erro interno ao verificar permissões');
    }
  }
}
