import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { AtendentesService } from '../../atendentes/services/atendentes.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly atendentesService: AtendentesService,
  ) {}
  async validateOAuthLogin(profile: any): Promise<User> {
    try {
      const email = profile.emails[0].value;

      // Verifica se é um email válido do IFCE
      if (!this.isValidIfceEmail(email)) {
        throw new BadRequestException(
          'Apenas emails do domínio @ifce.edu.br ou @aluno.ifce.edu.br são permitidos',
        );
      }

      const user: User = {
        id: profile.id,
        email: email,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        picture: profile.photos[0].value,
        accessToken: '',
        isAtendente: false,
        departamento: profile.department || '', // 
      };

      // Tenta criar ou atualizar o atendente
      try {
        const atendente =
          await this.atendentesService.createOrUpdateFromGoogleAuth(profile);
        user.isAtendente = true;
        user.atendenteId = atendente.id;
        user.departamento = atendente.departamento || user.departamento; // Atualiza o departamento se necessário
        this.logger.log(`Usuário autenticado como atendente: ${email}`);
      } catch (error) {
        this.logger.warn(
          `Usuário ${email} autenticado sem permissões de atendente: ${error.message}`,
        );
      }

      return user;
    } catch (error) {
      this.logger.error(`Erro na validação OAuth: ${error.message}`);
      throw error;
    }
  }

  private isValidIfceEmail(email: string): boolean {
    const validDomains = ['@ifce.edu.br', '@aluno.ifce.edu.br'];
    return validDomains.some((domain) => email.toLowerCase().endsWith(domain));
  }
  async login(user: User) {
    // Gerar JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAtendente: user.isAtendente,
      atendenteId: user.atendenteId,
    };

    // Gerar token de acesso
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        isAtendente: user.isAtendente,
        atendenteId: user.atendenteId,
        departamento: user.departamento || '',
      },
    };
  }
}
