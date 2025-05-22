import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Session, SessionState, UserData } from '../entities/session.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class SessionRepository {
  private readonly logger = new Logger(SessionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém uma sessão do banco de dados ou cria uma nova se não existir
   */
  async getOrCreateSession(
    userId: string,
    instanceId: string,
  ): Promise<Session> {
    console.log('getOrCreateSession', userId, instanceId);
    try {
      // Busca a sessão existente
      let dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
        include: {
          estudante: true,
          atendente: true,
          mensagens: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 10, // Obtém as últimas 10 mensagens para contexto
          },
        },
      });

      // Se não existir, cria uma nova
      if (!dbSession) {
        this.logger.log(
          `Criando nova sessão no banco de dados para o usuário ${userId}`,
        );
        dbSession = await this.prisma.sessao.create({
          data: {
            userId,
            estado: SessionState.MAIN_MENU,
            instanceName: instanceId,
            esperando_resposta: false,
          },
          include: {
            estudante: true,
            atendente: true,
            mensagens: true,
          },
        });
      } else {
        // Atualiza o timestamp da última interação
        dbSession = await this.prisma.sessao.update({
          where: { id: dbSession.id },
          data: {
            ultima_interacao: new Date(),
          },
          include: {
            estudante: true,
            atendente: true,
            mensagens: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 10,
            },
          },
        });
      }

      // Converte o objeto do banco de dados para o formato esperado pela aplicação
      const teste=  this.mapDbSessionToSession(dbSession);
      console.log('teste', teste);
      return teste;
    } catch (error) {
      this.logger.error(
        `Erro ao obter/criar sessão: ${error.message}`,
        error.stack,
      );

      // Em caso de erro de banco, retorna uma sessão em memória como fallback
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
   * Atualiza o estado da sessão no banco de dados
   */
  async updateSessionState(
    userId: string,
    newState: SessionState,
  ): Promise<Session | null> {
    try {
      const dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
      });

      if (!dbSession) return null;

      const updatedSession = await this.prisma.sessao.update({
        where: { id: dbSession.id },
        data: {
          estado: newState,
          ultima_interacao: new Date(),
        },
        include: {
          estudante: true,
          atendente: true,
          mensagens: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 10,
          },
        },
      });

      this.logger.log(
        `Estado da sessão do usuário ${userId} atualizado para ${newState}`,
      );
      return this.mapDbSessionToSession(updatedSession);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar estado da sessão: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Armazena uma nova mensagem na sessão
   */
  async saveMessage(
    userId: string,
    conteudo: string,
    origem: 'USUARIO' | 'BOT',
  ): Promise<void> {
    try {
      const dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
      });

      if (!dbSession) {
        this.logger.warn(
          `Tentativa de salvar mensagem para sessão inexistente: ${userId}`,
        );
        return;
      }

      await this.prisma.mensagem.create({
        data: {
          conteudo,
          origem,
          sessao: {
            connect: {
              id: dbSession.id,
            },
          },
        },
      });

      this.logger.debug(
        `Mensagem "${conteudo.substring(0, 20)}..." salva para usuário ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao salvar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Busca estudante pelo CPF e últimos dígitos do telefone
   */
  async findStudentByCpfAndPhone(
    cpf: string,
    lastDigits: string,
  ): Promise<UserData | null> {
    try {
      const estudante = await this.prisma.estudante.findFirst({
        where: {
          cpf,
          telefone: {
            endsWith: lastDigits,
          },
        },
      });

      if (!estudante) return null;

      return {
        cpf: estudante.cpf,
        telefone: estudante.telefone,
        nome: estudante.nome,
        curso: estudante.curso,
        matricula: estudante.matricula,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar estudante: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Atualiza os dados do estudante na sessão
   */
  async updateUserData(
    userId: string,
    userData: UserData,
  ): Promise<Session | null> {
    try {
      // Primeiro, busca a sessão
      const dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
      });

      if (!dbSession) return null;

      // Verifica se o estudante já existe pelo CPF
      let estudante = await this.prisma.estudante.findUnique({
        where: { cpf: userData.cpf },
      });

      // Se não existir, cria um novo estudante
      if (!estudante && userData.cpf) {
        estudante = await this.prisma.estudante.create({
          data: {
            nome: userData.nome || 'Nome não informado',
            cpf: userData.cpf,
            telefone: userData.telefone || '',
            matricula: userData.matricula || '',
            curso: userData.curso || 'Curso não informado',
          },
        });
      }

      // Atualiza a sessão com o ID do estudante
      const updatedSession = await this.prisma.sessao.update({
        where: { id: dbSession.id },
        data: {
          estudante_id: estudante?.id,
          ultima_interacao: new Date(),
        },
        include: {
          estudante: true,
          atendente: true,
          mensagens: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 10,
          },
        },
      });

      return this.mapDbSessionToSession(updatedSession);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados do usuário: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Atualiza os dados do usuário em uma sessão
   */
  async updateSessionData(
    userId: string,
    userData: UserData,
  ): Promise<Session> {
    try {
      // Busca a sessão existente
      const dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
        include: {
          estudante: true,
          atendente: true,
        },
      });

      if (!dbSession) {
        throw new Error(`Sessão não encontrada para o usuário ${userId}`);
      }

      // Atualizar informações do estudante ou criar se não existir
      if (userData) {
        let estudante = dbSession.estudante;

        if (estudante) {
          // Atualiza o estudante existente
          estudante = await this.prisma.estudante.update({
            where: { id: estudante.id },
            data: {
              nome: userData.nome || estudante.nome,
              cpf: userData.cpf || estudante.cpf,
              telefone: userData.telefone || estudante.telefone,
              curso: userData.curso || estudante.curso,
              matricula: userData.matricula || estudante.matricula,
              last_quoted_message: userData.lastQuotedMessage,
            },
          });
        } else {
          // Cria um novo estudante
          // estudante = await this.prisma.estudante.create({
          //   data: {
          //     nome: userData.nome,
          //     cpf: userData.cpf,
          //     telefone: userData.telefone,
          //     curso: userData.curso,
          //     matricula: userData.matricula,
          //     last_quoted_message: userData.lastQuotedMessage,
          //     sessao: {
          //       connect: { id: dbSession.id },
          //     },
          //   },
          // });
        }
      }

      // Busca a sessão com os dados atualizados
      const updatedDbSession = await this.prisma.sessao.findFirst({
        where: { userId },
        include: {
          estudante: true,
          atendente: true,
        },
      });

      // Converte para o modelo Session
      return this.mapDbSessionToSession(updatedDbSession);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar dados do usuário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Encerra uma sessão (não exclui, apenas marca como finalizada)
   */
  async encerrarSessao(userId: string): Promise<void> {
    try {
      const dbSession = await this.prisma.sessao.findFirst({
        where: { userId },
      });

      if (!dbSession) return;

      // Em vez de excluir, apenas atualiza o estado para ENCERRAMENTO
      await this.prisma.sessao.update({
        where: { id: dbSession.id },
        data: {
          estado: SessionState.ENCERRAMENTO,
        },
      });

      this.logger.log(`Sessão do usuário ${userId} encerrada`);
    } catch (error) {
      this.logger.error(
        `Erro ao encerrar sessão: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Obtém as últimas mensagens de uma sessão para contexto
   */
  async getSessionContext(userId: string, limit: number = 10): Promise<string> {
    try {
      const mensagens = await this.prisma.mensagem.findMany({
        where: {
          sessao: {
            userId,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });

      // Formata as mensagens em texto para contexto
      return mensagens
        .reverse()
        .map((msg) => `[${msg.origem}]: ${msg.conteudo}`)
        .join('\n');
    } catch (error) {
      this.logger.error(
        `Erro ao obter contexto da sessão: ${error.message}`,
        error.stack,
      );
      return '';
    }
  }

  /**
   * Limpa sessões antigas (mais de 24 horas sem interação)
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const result = await this.prisma.sessao.updateMany({
        where: {
          ultima_interacao: {
            lt: oneDayAgo,
          },
          NOT: {
            estado: SessionState.ENCERRAMENTO,
          },
        },
        data: {
          estado: SessionState.ENCERRAMENTO,
        },
      });

      if (result.count > 0) {
        this.logger.log(`${result.count} sessões antigas foram encerradas`);
      }

      return result.count;
    } catch (error) {
      this.logger.error(
        `Erro ao limpar sessões expiradas: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Função auxiliar para mapear um objeto de sessão do banco para o modelo da aplicação
   */
  private mapDbSessionToSession(dbSession: any): Session {
    const userData = new UserData();
    console.log('dbSession', dbSession);
    if (dbSession.estudante) {
      userData.nome = dbSession.estudante.nome;
      userData.cpf = dbSession.estudante.cpf;
      userData.telefone = dbSession.estudante.telefone;
      userData.matricula = dbSession.estudante.matricula;
      userData.curso = dbSession.estudante.curso;
    }

    // Converte o timestamp do banco para milissegundos
    const lastInteraction = dbSession.ultima_interacao
      ? new Date(dbSession.ultima_interacao).getTime()
      : Date.now();

    return {
      userId: dbSession.userId,
      state: dbSession.estado as SessionState,
      userData,
      lastInteractionTime: lastInteraction,
      instanceId: dbSession.instanceName,
      esperandoResposta: dbSession.esperando_resposta,
      // Opcional: incluir um array com as últimas mensagens se necessário
    };
  }
}
