import { Injectable, Logger } from '@nestjs/common';
import { Session, SessionState, UserData } from '../entities/session.entity';
import { SessionRepository } from '../repositories/session.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TIMEOUT = 1 * 60 * 1000; // 15 minutos em milissegundos
  private sessions: Map<string, Session> = new Map(); // Cache em memória para sessões ativas

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly prisma: PrismaService,
  ) {} /**
   * Obtém uma sessão existente ou cria uma nova se não existir ou estiver expirada
   */
  async getOrCreateSession(
    userId: string,
    instanceId: string,
  ): Promise<Session> {
    try {
      // Primeiro verifica no cache em memória
      let session = this.sessions.get(userId);
      console.log('session in memory', session);

      // Se estiver expirada, remove do cache
      if (session && session.state === SessionState.EXPIRED) {
        this.sessions.delete(userId);
        session = null;
      }

      if (!session) {
        // Se não estiver em cache, busca uma sessão ativa no banco de dados
        // O repository foi modificado para retornar apenas sessões não expiradas
        session = await this.sessionRepository.getOrCreateSession(
          userId,
          instanceId,
        );

        // Armazena em cache
        this.sessions.set(userId, session);
      } else {
        // Atualiza o timestamp da última interação
        session.lastInteractionTime = Date.now();
      }
      console.log('session in database', session);
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao obter/criar sessão: ${error.message}`,
        error.stack,
      );

      // Em caso de erro, retorna uma sessão em memória como fallback
      return {
        userId,
        state: SessionState.MAIN_MENU,
        userData: new UserData(),
        lastInteractionTime: Date.now(),
        instanceId,
        esperandoResposta: false,
      };
    }
  }

  /**
   * Atualiza o estado da sessão de um usuário
   */
  async updateSessionState(
    userId: string,
    newState: SessionState,
  ): Promise<Session | null> {
    try {
      // Atualiza no banco de dados
      const session = await this.sessionRepository.updateSessionState(
        userId,
        newState,
      );

      // Também atualiza em cache
      if (session) {
        this.sessions.set(userId, session);
      }

      this.logger.log(
        `Estado da sessão do usuário ${userId} atualizado para ${newState}`,
      );
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar estado da sessão: ${error.message}`,
        error.stack,
      );

      // Fallback: tenta atualizar apenas em memória
      const cachedSession = this.sessions.get(userId);
      if (cachedSession) {
        cachedSession.state = newState;
        cachedSession.lastInteractionTime = Date.now();
        return cachedSession;
      }

      return null;
    }
  }

  /**
   * Armazena uma mensagem recebida ou enviada
   */
  async saveMessage(
    userId: string,
    conteudo: string,
    origem: 'USUARIO' | 'BOT',
  ): Promise<void> {
    try {
      await this.sessionRepository.saveMessage(userId, conteudo, origem);
    } catch (error) {
      this.logger.error(
        `Erro ao salvar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Atualiza dados do usuário na sessão
   */
  async updateUserData(
    userId: string,
    userData: Partial<UserData>,
  ): Promise<Session | null> {
    try {
      // Primeiro, atualiza no banco de dados
      const cachedSession = this.sessions.get(userId);

      if (cachedSession) {
        // Mescla os dados atuais com os novos dados
        const updatedUserData = {
          ...cachedSession.userData,
          ...userData,
        } as UserData;

        // Atualiza no banco de dados
        const session = await this.sessionRepository.updateUserData(
          userId,
          updatedUserData,
        );

        // Atualiza em cache
        if (session) {
          this.sessions.set(userId, session);
        }

        return session;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados do usuário: ${error.message}`,
        error.stack,
      );

      // Fallback: tenta atualizar apenas em memória
      const cachedSession = this.sessions.get(userId);
      if (cachedSession) {
        cachedSession.userData = { ...cachedSession.userData, ...userData };
        cachedSession.lastInteractionTime = Date.now();
        return cachedSession;
      }

      return null;
    }
  }

  /**
   * Define se o chatbot está esperando uma resposta do usuário
   */
  async setEsperandoResposta(
    userId: string,
    esperando: boolean,
  ): Promise<void> {
    // Atualiza apenas em memória, não é crítico persistir no banco de dados
    const session = this.sessions.get(userId);
    if (session) {
      session.esperandoResposta = esperando;
    }
  }

  /**
   * Encerra uma sessão de usuário
   */
  async encerrarSessao(userId: string): Promise<void> {
    try {
      // Remove do cache em memória
      this.sessions.delete(userId);

      // Atualiza no banco de dados
      await this.sessionRepository.encerrarSessao(userId);

      this.logger.log(`Sessão do usuário ${userId} encerrada`);
    } catch (error) {
      this.logger.error(
        `Erro ao encerrar sessão: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Obtém o contexto da conversa (últimas mensagens)
   */
  async getSessionContext(userId: string, limit: number = 10): Promise<string> {
    return await this.sessionRepository.getSessionContext(userId, limit);
  }

  /**
   * Verifica e limpa sessões expiradas
   * @returns Número de sessões limpas
   */ async cleanExpiredSessions(): Promise<number> {
    try {
      // Marca sessões expiradas no cache em memória e no banco
      const now = Date.now();
      let expiredCount = 0; // Remove sessões expiradas do cache
      this.sessions.forEach((session, userId) => {
        if (now - session.lastInteractionTime > this.SESSION_TIMEOUT) {
          this.sessions.delete(userId);
          expiredCount++;
        }
      }); // Marca sessões expiradas no banco de dados (não deleta)
      // Importante: Não alteramos sessões que já estão marcadas como EXPIRED
      const result = await this.prisma.sessao.updateMany({
        where: {
          ultima_interacao: {
            lt: new Date(now - this.SESSION_TIMEOUT),
          },
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        data: {
          estado: SessionState.EXPIRED,
        },
      });

      const updatedCount = result.count;
      if (expiredCount > 0) {
        this.logger.log(
          `${expiredCount} sessões expiradas foram removidas do cache`,
        );
      }

      if (updatedCount > 0) {
        this.logger.log(
          `${updatedCount} sessões foram marcadas como expiradas no banco de dados`,
        );
      }

      // Sessões mais antigas (24 horas) também são marcadas como expiradas pelo repository
      const dbExpiredCount =
        await this.sessionRepository.cleanExpiredSessions();

      return expiredCount + updatedCount + dbExpiredCount;
    } catch (error) {
      this.logger.error(
        `Erro ao marcar sessões expiradas: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Busca usuário pelo CPF e telefone
   */
  async findUserByCpfAndPhone(
    cpf: string,
    phone: string,
  ): Promise<UserData | null> {
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

      // Fallback para dados fixos em caso de erro
      if (cpf === '12345678910' && phone.endsWith('2345')) {
        return {
          cpf,
          telefone: phone,
          nome: 'Ana Silva',
          curso: 'Engenharia Civil',
          matricula: '2023123456',
        };
      }

      return null;
    }
  }

  /**
   * Atualiza os dados do usuário em uma sessão
   */
  async updateSessionData(
    userId: string,
    userData: UserData,
  ): Promise<Session | null> {
    try {
      // Atualiza no banco de dados
      const session = await this.sessionRepository.updateSessionData(
        userId,
        userData,
      );

      // Também atualiza em cache
      if (session) {
        this.sessions.set(userId, session);
      }

      this.logger.log(`Dados do usuário ${userId} atualizados com sucesso`);
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados da sessão: ${error.message}`,
        error.stack,
      );

      // Fallback: tenta atualizar apenas em memória
      const cachedSession = this.sessions.get(userId);
      if (cachedSession) {
        cachedSession.userData = userData;
        cachedSession.lastInteractionTime = Date.now();
        return cachedSession;
      }

      return null;
    }
  }

  async getSessionWhatsAppCurrentState() {
    try {
      const response = await this.prisma.whatsAppSession.findFirst({
        where: {
          status: true,
        },
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Erro ao obter o estado atual do WhatsApp: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getSessionNameById(id: number) {
    try {
      const response = await this.prisma.whatsAppSession.findUnique({
        where: {
          id: id,
        },
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Erro ao obter o nome da sessão pelo ID: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
