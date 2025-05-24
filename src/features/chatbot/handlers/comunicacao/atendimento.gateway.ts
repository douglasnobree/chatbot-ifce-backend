import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProtocoloService } from '../../services/protocolo.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { MensagensService } from '../../services/mensagens.service';
import { WhatsappService } from '../../../whatsapp/service/whatsapp.service';
import { SendMessageDto } from '../../../whatsapp/dto/send-message.dto';
import { Sessao } from '@prisma/client';

interface ChatMessage {
  sender: 'usuario' | 'atendente';
  nome?: string;
  setor?: string;
  mensagem: string;
}

interface AtendimentoSession {
  usuario?: string; // socketId do usuário ou 'whatsapp' se for usuário via WhatsApp
  atendente?: string; // socketId do atendente
  setor?: string;
  nomeAtendente?: string;
  protocoloId?: string; // ID do protocolo associado
  estudanteId?: string; // ID do estudante
  atendenteId?: string; // ID do atendente no banco
  sessionDBId?: string; // ID da sessão no banco de dados
  whatsappUserId?: string; // ID do usuário no WhatsApp, se for usuário via WhatsApp
}

@WebSocketGateway({ cors: true, namespace: '/atendimento' })
@Injectable()
export class AtendimentoGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AtendimentoGateway.name);

  @WebSocketServer()
  server: Server;

  // Mapeia sessões: sessionId -> dados da sessão
  private sessions: Record<string, AtendimentoSession> = {};
  constructor(
    private readonly protocoloService: ProtocoloService,
    private readonly prisma: PrismaService,
    private readonly mensagensService: MensagensService,
  ) {}

  handleConnection(client: Socket) {
    // Pode adicionar lógica de autenticação aqui
  }

  handleDisconnect(client: Socket) {
    // Remove o socket das sessões
    for (const sessionId in this.sessions) {
      if (this.sessions[sessionId].usuario === client.id) {
        // Se um protocolo estava associado, não exclua a sessão
        // apenas remova o socket do usuário
        if (this.sessions[sessionId].protocoloId) {
          this.sessions[sessionId].usuario = undefined;
        } else {
          delete this.sessions[sessionId];
        }
      }
      if (this.sessions[sessionId].atendente === client.id) {
        this.sessions[sessionId].atendente = undefined;
        this.sessions[sessionId].nomeAtendente = undefined;
      }
    }
  }

  // Iniciar novo atendimento - NÃO é mais usado com WhatsApp
  // Mantido apenas para retrocompatibilidade
  @SubscribeMessage('iniciarAtendimento')
  async handleIniciarAtendimento(
    @MessageBody()
    data: {
      sessionId: string;
      setor: string;
      estudanteId?: string;
      sessionDBId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.sessions[data.sessionId] = {
      usuario: client.id,
      setor: data.setor,
      estudanteId: data.estudanteId,
      sessionDBId: data.sessionDBId,
    };

    client.join(data.sessionId);

    // Criar protocolo no banco de dados
    if (data.sessionDBId && data.estudanteId) {
      try {
        const protocolo = await this.protocoloService.criarProtocoloDB({
          setor: data.setor,
          sessao_id: data.sessionDBId,
          estudante_id: data.estudanteId,
          assunto: 'Atendimento em tempo real',
        });

        // Salva o ID do protocolo na sessão
        this.sessions[data.sessionId].protocoloId = protocolo.id;

        // Registra mensagem de sistema no protocolo
        await this.protocoloService.registrarMensagemProtocolo({
          protocolo_id: protocolo.id,
          conteudo: `Atendimento iniciado pelo usuário para o setor: ${data.setor}`,
          origem: 'SISTEMA',
        });

        this.server.to(client.id).emit('atendimentoAguardando', {
          message: 'Aguardando um atendente...',
          protocolo: protocolo.numero,
        });
      } catch (error) {
        console.error('Erro ao criar protocolo:', error);
        this.server.to(client.id).emit('atendimentoAguardando', {
          message: 'Aguardando um atendente...',
        });
      }
    } else {
      this.server.to(client.id).emit('atendimentoAguardando', {
        message: 'Aguardando um atendente...',
      });
    }
  }

  // Atendente entra na sessão
  @SubscribeMessage('entrarAtendimento')
  async handleEntrarAtendimento(
    @MessageBody()
    data: {
      sessionId: string;
      nome: string;
      setor: string;
      atendenteId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.sessions[data.sessionId]) return;

    this.sessions[data.sessionId].atendente = client.id;
    this.sessions[data.sessionId].nomeAtendente = data.nome;
    this.sessions[data.sessionId].setor = data.setor;
    this.sessions[data.sessionId].atendenteId = data.atendenteId;

    client.join(data.sessionId);

    // Atualiza o protocolo associado com o ID do atendente
    const protocoloId = this.sessions[data.sessionId].protocoloId;
    if (protocoloId) {
      try {
        const protocolo = await this.prisma.protocolo.findUnique({
          where: { id: protocoloId },
        });

        if (protocolo) {
          await this.protocoloService.atribuirAtendente(
            protocolo.numero,
            data.atendenteId,
          );

          // Registra mensagem de sistema no protocolo
          await this.protocoloService.registrarMensagemProtocolo({
            protocolo_id: protocoloId,
            conteudo: `Atendente ${data.nome} entrou no atendimento`,
            origem: 'SISTEMA',
          });
        }
      } catch (error) {
        console.error('Erro ao atribuir atendente ao protocolo:', error);
      }
    }

    this.server
      .to(data.sessionId)
      .emit('atendenteEntrou', { nome: data.nome, setor: data.setor });
  } // Envio de mensagem
  @SubscribeMessage('enviarMensagem')
  async handleEnviarMensagem(
    @MessageBody()
    data: {
      sessionId: string;
      mensagem: string;
      sender: 'usuario' | 'atendente';
    },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.sessions[data.sessionId];
    if (!session) return;

    let mensagemFormatada: string;
    if (data.sender === 'atendente') {
      mensagemFormatada = `[${session.nomeAtendente}][${session.setor}] - ${data.mensagem}`;

      // Enviar mensagem para o WhatsApp se for do atendente
      if (session.sessionDBId) {
        try {
          // Buscar a sessão do usuário para enviar mensagem via WhatsApp
          const sessaoDB = await this.prisma.sessao.findUnique({
            where: { id: session.sessionDBId },
          });

          if (sessaoDB) {
            this.logger.log(
              `Enviando mensagem do atendente para WhatsApp: ${sessaoDB.userId}`,
            );

            // Enviar mensagem para o WhatsApp através do serviço de mensagens injetado
            await this.mensagensService.enviarMensagem(
              sessaoDB,
              mensagemFormatada,
            );
            this.logger.log(
              `Mensagem enviada para o WhatsApp: ${sessaoDB.userId}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao enviar mensagem para WhatsApp: ${error.message}`,
            error.stack,
          );
        }
      }
    } else {
      mensagemFormatada = data.mensagem;
    }

    this.server.to(data.sessionId).emit('novaMensagem', {
      sender: data.sender,
      mensagem: mensagemFormatada,
    });

    // Salvar a mensagem no protocolo, se houver um protocolo associado
    if (session.protocoloId) {
      try {
        await this.protocoloService.registrarMensagemProtocolo({
          protocolo_id: session.protocoloId,
          conteudo: mensagemFormatada,
          origem: data.sender === 'usuario' ? 'USUARIO' : 'ATENDENTE',
        });
      } catch (error) {
        console.error('Erro ao salvar mensagem no protocolo:', error);
      }
    }
  }
  // Listar atendimentos abertos para o painel do atendente
  @SubscribeMessage('listarAtendimentos')
  async handleListarAtendimentos(_: any, @ConnectedSocket() client: Socket) {
    // Retorna sessões que têm usuário mais não atendente
    const abertos = Object.entries(this.sessions)
      .filter(([_, s]) => s.usuario && !s.atendente)
      .map(([sessionId, s]) => ({
        sessionId,
        setor: s.setor,
        protocolo: s.protocoloId ? 'Sim' : 'Não',
        origem: s.usuario === 'whatsapp' ? 'WhatsApp' : 'Web',
      }));

    client.emit('atendimentosAbertos', abertos);
  }

  // Encerrar um atendimento
  @SubscribeMessage('encerrarAtendimento')
  async handleEncerrarAtendimento(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = this.sessions[data.sessionId];
    if (!session) return;

    // Fecha o protocolo se existir
    if (session.protocoloId) {
      try {
        const protocolo = await this.prisma.protocolo.findUnique({
          where: { id: session.protocoloId },
        });

        if (protocolo) {
          await this.protocoloService.atualizarStatusProtocolo(
            protocolo.numero,
            'FECHADO',
          );

          // Registra mensagem de encerramento
          await this.protocoloService.registrarMensagemProtocolo({
            protocolo_id: session.protocoloId,
            conteudo: 'Atendimento encerrado',
            origem: 'SISTEMA',
          });
        }
      } catch (error) {
        console.error('Erro ao encerrar protocolo:', error);
      }
    }

    // Notifica todos os participantes do encerramento
    this.server.to(data.sessionId).emit('atendimentoEncerrado', {
      message: 'Este atendimento foi encerrado',
    });

    // Remove a sessão
    delete this.sessions[data.sessionId];
  }
  /**
   * Cria uma sessão de atendimento a partir de uma sessão do WhatsApp
   * Usado quando um usuário solicita atendimento humano pelo WhatsApp
   */ async criarAtendimentoFromWhatsApp(sessaoDB: Sessao): Promise<string> {
    const sessionId = sessaoDB.id;
    let setor = 'Não especificado';

    // Buscar o estudante e obter o setor de escolha
    if (sessaoDB.estudante_id) {
      const estudante = await this.prisma.estudante.findUnique({
        where: { id: sessaoDB.estudante_id },
      });

      if (estudante) {
        setor = estudante.escolhaSetor || 'Não especificado';
      }
    }

    this.logger.log(
      `Criando atendimento WhatsApp para sessão ${sessionId}, setor ${setor}`,
    );

    // Cria a sessão no registro de atendimentos
    this.sessions[sessionId] = {
      setor: setor,
      estudanteId: sessaoDB.estudante_id,
      sessionDBId: sessaoDB.id,
      usuario: 'whatsapp', // Marca que o usuário está no WhatsApp, não no WebSocket
      whatsappUserId: sessaoDB.userId, // ID do usuário no WhatsApp para enviar mensagens
    };

    // Cria um protocolo para este atendimento
    try {
      const protocolo = await this.protocoloService.criarProtocoloDB({
        setor: setor,
        sessao_id: sessaoDB.id,
        estudante_id: sessaoDB.estudante_id,
        assunto: 'Atendimento em tempo real via WhatsApp',
      });

      // Salva o ID do protocolo na sessão
      this.sessions[sessionId].protocoloId = protocolo.id;

      // Registra mensagem de sistema no protocolo
      await this.protocoloService.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Atendimento iniciado pelo usuário para o setor: ${setor}`,
        origem: 'SISTEMA',
      });

      return protocolo.numero;
    } catch (error) {
      console.error(
        'Erro ao criar protocolo para atendimento WhatsApp:',
        error,
      );
      return null;
    }
  }
  /**
   * Processa mensagem recebida pelo webhook e encaminha para o atendente
   * Este método deve ser chamado quando uma mensagem do WhatsApp chega
   * para uma sessão que está em atendimento humano
   */
  async processarMensagemWhatsApp(
    sessaoDB: Sessao,
    mensagem: string,
  ): Promise<void> {
    try {
      const sessionId = sessaoDB.id;
      const session = this.sessions[sessionId];

      // Verifica se esta sessão está em atendimento
      if (!session) {
        this.logger.warn(
          `Sessão de WhatsApp ${sessionId} não está em atendimento`,
        );
        return;
      }

      this.logger.log(
        `Mensagem de WhatsApp recebida para sessão em atendimento: ${sessionId}`,
      );

      // Enviar a mensagem para o atendente conectado, se houver
      if (session.atendente) {
        this.server.to(session.atendente).emit('novaMensagem', {
          sender: 'usuario',
          mensagem: mensagem,
        });

        // Salva a mensagem no protocolo
        if (session.protocoloId) {
          await this.protocoloService.registrarMensagemProtocolo({
            protocolo_id: session.protocoloId,
            conteudo: mensagem,
            origem: 'USUARIO',
          });
        }
      } else {
        this.logger.warn(
          `Mensagem recebida para sessão ${sessionId}, mas não há atendente conectado`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem do WhatsApp: ${error.message}`,
        error.stack,
      );
    }
  }
}
