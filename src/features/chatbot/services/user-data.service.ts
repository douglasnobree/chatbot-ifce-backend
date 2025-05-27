import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { Estudante } from '@prisma/client';

@Injectable()
export class UserDataService {
  private readonly logger = new Logger(UserDataService.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  /**
   * Atualiza dados do usuário na sessão
   */
  async updateUserData(
    userId: string,
    userData: Partial<Estudante>,
    cachedSession?: any,
  ) {
    try {
      if (cachedSession) {
        // Mescla os dados atuais com os novos dados
        const updatedUserData = {
          ...cachedSession.estudante,
          ...userData,
        };
        console.log('updatedUserData', updatedUserData, userId);

        // Atualiza no banco de dados
        return await this.sessionRepository.updateUserData(
          userId,
          updatedUserData,
        );
      }
      console.log('userData', userId, userData);
      return
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados do usuário: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Busca usuário pelo CPF e telefone
   */
  async findUserByCpfAndPhone(
    cpf: string,
    phone: string,
  ): Promise<Estudante | null> {
    try {
      // Extrai apenas os 4 últimos dígitos do telefone
      const lastDigits = phone.slice(-4);

      // Busca no banco de dados
      return await this.sessionRepository.findStudentByCpfAndPhone(
        cpf,
        lastDigits,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por CPF e telefone: ${error.message}`,
        error.stack,
      );

      return null;
    }
  }

  /**
   * Atualiza os dados do usuário em uma sessão
   */
  async updateSessionData(userId: string, userData: Partial<Estudante>) {
    try {
      // Atualiza no banco de dados
      return await this.sessionRepository.updateSessionData(userId, userData);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados da sessão: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * ATENÇÃO: O campo 'escolhaSetor' não existe no modelo Estudante do Prisma.
   * Se for necessário persistir essa informação, adicione o campo ao schema.prisma e gere uma migration.
   * Por enquanto, updateUserData só atualiza campos existentes em Estudante.
   */
}
