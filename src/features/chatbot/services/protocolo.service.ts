import { Injectable, Logger } from '@nestjs/common';
import { MensagensService } from './mensagens.service';
import { SessionService } from './session.service';
import { UserDataService } from './user-data.service';
import { MenuTexts, SuccessMessages } from '../constants/menu-texts';
import { Sessao } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProtocoloService {
  private readonly logger = new Logger(ProtocoloService.name);

  constructor(
    private readonly mensagensService: MensagensService,
    private readonly sessionService: SessionService,
    private readonly userDataService: UserDataService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gera um novo número de protocolo para um atendimento
   * @returns Número de protocolo gerado
   */
  gerarNumeroProtocolo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  /**
   * Registra um protocolo de atendimento
   * @param session Sessão do usuário
   * @param setor Setor de destino do protocolo
   * @param descricao Descrição do protocolo
   */
  async registrarProtocolo(
    session: Sessao,
    setor: string,
    descricao?: string,
  ): Promise<string> {
    try {
      // Gera um número de protocolo
      const numeroProtocolo = this.gerarNumeroProtocolo();

      this.logger.log(
        `Protocolo ${numeroProtocolo} gerado para usuário ${session.userId} - Setor: ${setor}`,
      );

      // Criar um protocolo no banco de dados
      const protocolo = await this.criarProtocoloDB({
        setor,
        sessao_id: session.id,
        estudante_id: session.estudante_id,
        assunto: descricao,
      });

      return protocolo.numero;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Confirma protocolo e envia mensagem de confirmação
   * @param session Sessão do usuário
   * @param setor Setor do protocolo
   */
  async confirmarProtocolo(session: Sessao, setor: string): Promise<void> {
    try {
      const numeroProtocolo = await this.registrarProtocolo(session, setor);

      // Envia a mensagem de confirmação ao usuário
      await this.mensagensService.enviarMensagem(
        session,
        SuccessMessages.PROTOCOLO_GERADO(setor, numeroProtocolo),
      );
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar protocolo: ${error.message}`,
        error.stack,
      );

      // Em caso de erro, envia uma mensagem genérica
      await this.mensagensService.enviarMensagem(
        session,
        'Desculpe, ocorreu um erro ao registrar seu protocolo. Por favor, tente novamente mais tarde.',
      );
    }
  }
  /**
   * Cria um novo protocolo no banco de dados
   * @param data Dados do protocolo a ser criado
   */
  async criarProtocoloDB(data: {
    setor: string;
    sessao_id?: string;
    estudante_id?: string;
    assunto?: string;
  }) {
    try {
      const numeroProtocolo = this.gerarNumeroProtocolo();

      const protocolo = await this.prisma.protocolo.create({
        data: {
          numero: numeroProtocolo,
          setor: data.setor,
          assunto: data.assunto,
          sessao_id: data.sessao_id,
          estudante_id: data.estudante_id,
          status: 'ABERTO',
        },
        include: {
          sessao: true,
          estudante: true,
        },
      });

      // Registra mensagem de sistema indicando a criação do protocolo
      await this.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Protocolo ${numeroProtocolo} criado para o setor ${data.setor}`,
        origem: 'SISTEMA',
      });

      this.logger.log(
        `Protocolo ${numeroProtocolo} criado no banco para o setor ${data.setor}`,
      );

      return protocolo;
    } catch (error) {
      this.logger.error(
        `Erro ao criar protocolo no banco: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Atualiza o status de um protocolo
   * @param numeroProtocolo Número do protocolo
   * @param status Novo status
   */
  async atualizarStatusProtocolo(numeroProtocolo: string, status: string) {
    try {
      const protocolo = await this.prisma.protocolo.update({
        where: { numero: numeroProtocolo },
        data: {
          status,
          ...(status === 'FECHADO' ? { data_fechamento: new Date() } : {}),
        },
      });

      // Registra mensagem de mudança de status
      await this.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Status do protocolo alterado para: ${status}`,
        origem: 'SISTEMA',
      });

      return protocolo;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar status do protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Atribui um atendente a um protocolo
   * @param numeroProtocolo Número do protocolo
   * @param atendente_id ID do atendente
   */
  async atribuirAtendente(numeroProtocolo: string, atendente_id: string) {
    try {
      const protocolo = await this.prisma.protocolo.update({
        where: { numero: numeroProtocolo },
        data: {
          atendente_id,
          status: 'EM_ATENDIMENTO',
        },
        include: {
          atendente: true,
        },
      });

      // Registra mensagem de atribuição
      await this.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Protocolo atribuído ao atendente: ${protocolo.atendente.nome}`,
        origem: 'SISTEMA',
      });

      return protocolo;
    } catch (error) {
      this.logger.error(
        `Erro ao atribuir atendente ao protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Busca um protocolo pelo número
   * @param numeroProtocolo Número do protocolo
   */
  async buscarProtocoloPorNumero(numeroProtocolo: string) {
    try {
      const protocolo = await this.prisma.protocolo.findUnique({
        where: { numero: numeroProtocolo },
        include: {
          sessao: true,
          estudante: true,
          atendente: true,
          mensagens_protocolo: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
      });

      if (!protocolo) {
        throw new Error(`Protocolo ${numeroProtocolo} não encontrado`);
      }

      return protocolo;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Registra uma mensagem em um protocolo
   * @param data Dados da mensagem
   */
  async registrarMensagemProtocolo(data: {
    protocolo_id: string;
    conteudo: string;
    origem: string; // USUARIO, ATENDENTE, SISTEMA
  }) {
    try {
      const mensagem = await this.prisma.mensagemProtocolo.create({
        data: {
          protocolo_id: data.protocolo_id,
          conteudo: data.conteudo,
          origem: data.origem,
        },
      });

      return mensagem;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar mensagem de protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lista protocolos por status
   * @param status Status dos protocolos a serem listados
   */
  async listarProtocolosPorStatus(status: string) {
    try {
      const protocolos = await this.prisma.protocolo.findMany({
        where: { status },
        include: {
          estudante: true,
          atendente: true,
        },
        orderBy: {
          data_criacao: 'desc',
        },
      });

      return protocolos;
    } catch (error) {
      this.logger.error(
        `Erro ao listar protocolos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lista todos os protocolos de um estudante
   * @param estudanteId ID do estudante
   */
  async listarProtocolosPorEstudante(estudanteId: string) {
    try {
      const protocolos = await this.prisma.protocolo.findMany({
        where: { estudante_id: estudanteId },
        include: {
          atendente: true,
        },
        orderBy: {
          data_criacao: 'desc',
        },
      });

      return protocolos;
    } catch (error) {
      this.logger.error(
        `Erro ao listar protocolos do estudante: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
