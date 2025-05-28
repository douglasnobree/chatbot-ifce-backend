import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      this.logger.warn('Tentativa de acesso admin sem usuário autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!user.isAtendente) {
      this.logger.warn(
        `Usuário ${user.email} tentou acessar recurso administrativo sem ser atendente`,
      );
      throw new ForbiddenException(
        'Acesso negado: apenas atendentes podem acessar recursos administrativos',
      );
    }

    // Verifica se é um email institucional (não de aluno)
    const isInstitutionalEmail = user.email
      .toLowerCase()
      .endsWith('@ifce.edu.br');

    if (!isInstitutionalEmail) {
      this.logger.warn(
        `Atendente ${user.email} tentou acessar recurso administrativo sem permissão institucional`,
      );
      throw new ForbiddenException(
        'Acesso negado: apenas funcionários do IFCE podem acessar recursos administrativos',
      );
    }

    this.logger.log(`Acesso administrativo autorizado para: ${user.email}`);
    return true;
  }
}
