import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionState } from '@prisma/client';
import { Prisma, Estudante } from '@prisma/client';

@Injectable()
export class SessionRepository {
  private readonly logger = new Logger(SessionRepository.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Cria uma nova sessão no banco de dados
   */
  async createNewSession(userId: string, instanceId: string) {
    try {
      this.logger.log(
        `Criando nova sessão no banco de dados para o usuário ${userId}`,
      );
      return await this.prisma.sessao.create({
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
    } catch (error) {
      this.logger.error(
        `Erro ao criar nova sessão: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  /**
   * Obtém uma sessão do banco de dados ou cria uma nova se não existir
   */
  async getOrCreateSession(userId: string, instanceId: string) {
    console.log('getOrCreateSession', userId, instanceId);
    try {
      // Busca a sessão existente mais recente que não está expirada
      let dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
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

      // Se não existir sessão ativa (todas estão expiradas ou não existe), cria uma nova
      if (!dbSession) {
        this.logger.log(
          `Nenhuma sessão ativa encontrada para o usuário ${userId}, criando uma nova`,
        );

        // Vamos verificar se há sessões expiradas para facilitar debugging
        const expiredSessions = await this.prisma.sessao.findMany({
          where: {
            userId,
            estado: SessionState.EXPIRED,
          },
          select: { id: true },
        });

        if (expiredSessions.length > 0) {
          this.logger.log(
            `O usuário ${userId} possui ${expiredSessions.length} sessões expiradas que serão mantidas no histórico`,
          );
        }

        return await this.createNewSession(userId, instanceId);
      } else {
        // Atualiza o timestamp da última interação da sessão ativa
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

      return dbSession;
    } catch (error) {
      this.logger.error(
        `Erro ao obter/criar sessão: ${error.message}`,
        error.stack,
      );

      // Em caso de erro de banco, retorna uma sessão em memória como fallback
      return {
        userId,
        state: SessionState.MAIN_MENU,
        lastInteractionTime: Date.now(),
        instanceId,
        esperandoResposta: false,
      };
    }
  }
  /**
   * Atualiza o estado da sessão no banco de dados
   */
  async updateSessionState(userId: string, newState: SessionState) {
    try {
      // Busca apenas sessões não expiradas
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
      });

      if (!dbSession) {
        this.logger.warn(
          `Tentativa de atualizar estado de sessão inexistente ou expirada para o usuário ${userId}`,
        );
        return null;
      }

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
      return updatedSession;
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
  ) {
    try {
      // Busca apenas sessões ativas (não expiradas)
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
      });

      if (!dbSession) {
        this.logger.warn(
          `Tentativa de salvar mensagem para sessão inexistente ou expirada: ${userId}`,
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
  async findStudentByCpfAndPhone(cpf: string, lastDigits: string) {
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
      return estudante;
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
  async updateUserData(userId: string, userData: Partial<Estudante>) {
    try {
      // Primeiro, busca a sessão ativa
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
      });

      if (!dbSession) {
        this.logger.warn(
          `Tentativa de atualizar dados de usuário para sessão inexistente ou expirada: ${userId}`,
        );
        return null;
      }

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

      return updatedSession;
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
  async updateSessionData(userId: string, userData: Partial<Estudante>) {
    try {
      // Busca a sessão ativa
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
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
              last_quoted_message: userData.last_quoted_message,
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
          //     last_quoted_message: userData.last_quoted_message,
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
      return updatedDbSession;
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
  async encerrarSessao(userId: string) {
    try {
      // Busca a sessão ativa (não expirada)
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
      });

      if (!dbSession) {
        this.logger.debug(
          `Nenhuma sessão ativa encontrada para encerrar do usuário ${userId}`,
        );
        return;
      }

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
  async getSessionContext(userId: string, limit: number = 10) {
    try {
      // Primeiro encontrar a sessão ativa
      const sessaoAtiva = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
        select: { id: true },
      });

      if (!sessaoAtiva) {
        this.logger.debug(
          `Nenhuma sessão ativa encontrada para obter contexto do usuário ${userId}`,
        );
        return '';
      }

      // Buscar mensagens apenas da sessão ativa
      const mensagens = await this.prisma.mensagem.findMany({
        where: {
          sessao_id: sessaoAtiva.id,
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
   * Marca sessões antigas (mais de 24 horas sem interação) como expiradas
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
            estado: SessionState.EXPIRED,
          },
        },
        data: {
          estado: SessionState.EXPIRED,
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `${result.count} sessões antigas foram marcadas como expiradas`,
        );
      }

      return result.count;
    } catch (error) {
      this.logger.error(
        `Erro ao marcar sessões expiradas: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async getLatestSession(userId: string) {
    try {
      const dbSession = await this.prisma.sessao.findFirst({
        where: {
          userId,
          NOT: {
            estado: SessionState.EXPIRED,
          },
        },
        orderBy: {
          ultima_interacao: 'desc',
        },
        include: {
          estudante: true,
          atendente: true,
        },
      });

      if (!dbSession) return null;

      return dbSession;
    } catch (error) {
      this.logger.error(
        `Erro ao obter a última sessão do usuário ${userId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
