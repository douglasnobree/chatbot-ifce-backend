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
import { stat } from 'fs';

interface ChatMessage {
  sender: 'usuario' | 'atendente';
  nome?: string;
  setor?: string;
  mensagem: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video' | 'audio';
  fileName?: string;
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

  constructor(
    private readonly protocoloService: ProtocoloService,
    private readonly prisma: PrismaService,
    private readonly mensagensService: MensagensService,
    private readonly whatsappService: WhatsappService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Remove o socket do atendente das sessões do banco
    // Não há mais sessões em memória
    // Opcional: pode-se atualizar algum campo de status do atendente, se necessário
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('iniciarAtendimento')
  async handleIniciarAtendimento(
    @MessageBody()
    data: {
      sessao_id: string;
      setor: string;
      estudanteId?: string;
      sessionDBId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Adiciona o cliente à sala da sessão
    client.join(data.sessionDBId || data.sessao_id);

    // Cria protocolo no banco de dados
    if (data.sessionDBId && data.estudanteId) {
      try {
        const protocolo = await this.protocoloService.criarProtocoloDB({
          setor: data.setor,
          sessao_id: data.sessionDBId,
          estudante_id: data.estudanteId,
          assunto: 'Atendimento em tempo real',
        });
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

  @SubscribeMessage('entrarAtendimento')
  async handleEntrarAtendimento(
    @MessageBody()
    data: {
      sessao_id: string;
      nome: string;
      setor: string;
      atendenteId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `[ENTRAR_ATENDIMENTO] Atendente ${data.nome} tentando entrar na sessão ${data.sessao_id}`,
    );

    // Adiciona o socket do atendente à sala da sessão
    client.join(data.sessao_id);

    // Busca o protocolo associado à sessão
    console.log(data.sessao_id);
    const protocolo = await this.prisma.protocolo.findFirst({
      where: { sessao_id: data.sessao_id, status: 'ABERTO' },
    });
    if (!protocolo) {
      this.logger.warn(
        `[ENTRAR_ATENDIMENTO] Protocolo não encontrado para sessão ${data.sessao_id}`,
      );
      return;
    }
    try {
      await this.protocoloService.atribuirAtendente(
        protocolo.numero,
        data.atendenteId,
      );
      await this.protocoloService.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Atendente ${data.nome} entrou no atendimento`,
        origem: 'SISTEMA',
      });
      // Notifica o usuário via WhatsApp, se necessário
      const sessaoDB = await this.prisma.sessao.findUnique({
        where: { id: data.sessao_id },
      });
      if (sessaoDB) {
        await this.mensagensService.enviarMensagem(
          sessaoDB,
          `👨‍💼 O atendente ${data.nome} do setor ${data.setor} entrou no atendimento. Você já pode enviar suas mensagens!`,
        );
      }
      this.server
        .to(data.sessao_id)
        .emit('atendenteEntrou', { nome: data.nome, setor: data.setor });
    } catch (error) {
      this.logger.error(
        `[ENTRAR_ATENDIMENTO] Erro ao atribuir atendente ao protocolo: ${error.message}`,
        error.stack,
      );
    }
  }

  @SubscribeMessage('enviarMensagem')
  async handleEnviarMensagem(
    @MessageBody()
    data: {
      sessao_id: string;
      mensagem: string;
      sender: 'usuario' | 'atendente';
      mediaUrl?: string;
      mediaType?: 'image' | 'document' | 'video' | 'audio';
      fileName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Busca o protocolo aberto da sessão
    const protocolo = await this.prisma.protocolo.findFirst({
      where: { sessao_id: data.sessao_id, status: 'EM_ATENDIMENTO' },
      include: { atendente: true },
    });
    if (!protocolo) {
      this.logger.warn(
        `[ENVIAR_MENSAGEM] Protocolo não encontrado para sessão ${data.sessao_id}`,
      );
      return;
    }
    let mensagemFormatada = data.mensagem;
    if (data.sender === 'atendente' && protocolo.atendente) {
      mensagemFormatada = `[${protocolo.atendente.nome}][${protocolo.setor}] - ${data.mensagem}`;
      // Envia para WhatsApp
      const sessaoDB = await this.prisma.sessao.findUnique({
        where: { id: data.sessao_id },
      });
      if (sessaoDB) {
        // Se tiver mídia, envia como mídia
        if (data.mediaUrl && data.mediaType) {
          // A mensagem já é enviada pelo front-end diretamente para o WhatsApp API
          // Aqui apenas registramos que foi enviado
          this.logger.log(
            `[ENVIAR_MIDIA] Arquivo enviado para WhatsApp: ${data.fileName}`,
          );
        } else {
          // Envia texto normal
          await this.mensagensService.enviarMensagem(
            sessaoDB,
            mensagemFormatada,
          );
        }
      }
    }

    // Emite para todos os clientes na sala, incluindo metadados de mídia
    this.server.to(data.sessao_id).emit('novaMensagem', {
      sender: data.sender,
      mensagem: mensagemFormatada,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      fileName: data.fileName,
    });

    // Registra no histórico do protocolo, incluindo informação sobre arquivos
    let conteudoHistorico = mensagemFormatada;
    if (data.fileName) {
      conteudoHistorico = `[Arquivo: ${data.fileName}] ${mensagemFormatada}`;
    }

    await this.protocoloService.registrarMensagemProtocolo({
      protocolo_id: protocolo.id,
      conteudo: conteudoHistorico,
      origem: data.sender === 'usuario' ? 'USUARIO' : 'ATENDENTE',
    });
  }

  @SubscribeMessage('enviarArquivo')
  async handleEnviarArquivo(
    @MessageBody()
    data: {
      sessao_id: string;
      mensagem?: string;
      sender: 'usuario' | 'atendente';
      mediaUrl: string;
      mediaType: 'image' | 'document' | 'video' | 'audio';
      fileName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Similar ao enviar mensagem, mas específico para arquivos
    this.logger.log(
      `[ENVIAR_ARQUIVO] Recebendo arquivo tipo ${data.mediaType}: ${data.fileName}`,
    );

    // Busca o protocolo aberto da sessão
    const protocolo = await this.prisma.protocolo.findFirst({
      where: { sessao_id: data.sessao_id, status: 'EM_ATENDIMENTO' },
      include: { atendente: true },
    });
    if (!protocolo) {
      this.logger.warn(
        `[ENVIAR_ARQUIVO] Protocolo não encontrado para sessão ${data.sessao_id}`,
      );
      return;
    }

    // Emite para todos os clientes na sala
    this.server.to(data.sessao_id).emit('novoArquivo', {
      sender: data.sender,
      mensagem: data.mensagem || '',
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      fileName: data.fileName,
    });

    // Registra no histórico do protocolo
    await this.protocoloService.registrarMensagemProtocolo({
      protocolo_id: protocolo.id,
      conteudo: `[Arquivo: ${data.fileName}] ${data.mensagem || ''}`,
      origem: data.sender === 'usuario' ? 'USUARIO' : 'ATENDENTE',
    });
  }

  @SubscribeMessage('listarAtendimentos')
  async handleListarAtendimentos(_: any, @ConnectedSocket() client: Socket) {
    // Lista protocolos abertos
    const response = await this.prisma.protocolo.findMany({
      where: {
        OR: [{ status: 'ABERTO' }, { status: 'EM_ATENDIMENTO' }],
      },
      include: { estudante: true, atendente: true, mensagens_protocolo: true },
    });
    client.emit('atendimentosAbertos', response);
  }

  @SubscribeMessage('encerrarAtendimento')
  async handleEncerrarAtendimento(
    @MessageBody() data: { sessao_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `[ENCERRAR_ATENDIMENTO] Solicitação de encerramento para sessão ${data.sessao_id}`,
    );
    // Busca o protocolo aberto da sessão
    const protocolo = await this.prisma.protocolo.findFirst({
      where: { sessao_id: data.sessao_id, status: 'EM_ATENDIMENTO' },
    });
    if (!protocolo) {
      this.logger.warn(
        `[ENCERRAR_ATENDIMENTO] Protocolo não encontrado para sessão ${data.sessao_id}`,
      );
      return;
    }
    try {
      await this.protocoloService.atualizarStatusProtocolo(
        protocolo.numero,
        'FECHADO',
      );
      await this.protocoloService.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: 'Atendimento encerrado',
        origem: 'SISTEMA',
      });
      // Notifica usuário via WhatsApp
      const sessaoDB = await this.prisma.sessao.findUnique({
        where: { id: data.sessao_id },
      });
      if (sessaoDB) {
        await this.prisma.sessao.update({
          where: { id: data.sessao_id },
          data: { estado: 'MAIN_MENU' },
        });
        await this.mensagensService.enviarMensagem(
          sessaoDB,
          `🔚 Este atendimento foi encerrado. Se precisar de mais ajuda, você pode iniciar um novo atendimento a qualquer momento.`,
        );
      }
      this.server.to(data.sessao_id).emit('atendimentoEncerrado', {
        message: 'Este atendimento foi encerrado',
      });
    } catch (error) {
      this.logger.error(
        `[ENCERRAR_ATENDIMENTO] Erro ao encerrar protocolo: ${error.message}`,
        error.stack,
      );
    }
  }

  async criarAtendimentoFromWhatsApp(sessaoDB: Sessao): Promise<string> {
    let setor = 'Não especificado';
    if (sessaoDB.estudante_id) {
      try {
        const estudante = await this.prisma.estudante.findUnique({
          where: { id: sessaoDB.estudante_id },
        });
        if (estudante) {
          setor = estudante.escolhaSetor || 'Não especificado';
        }
      } catch (error) {
        this.logger.error(
          `[CRIAR_ATENDIMENTO_WHATSAPP] Erro ao buscar estudante: ${error.message}`,
          error.stack,
        );
      }
    }
    // Verifica se já existe protocolo aberto para esta sessão
    const protocoloExistente = await this.prisma.protocolo.findFirst({
      where: { sessao_id: sessaoDB.id, status: 'ABERTO' },
    });
    if (protocoloExistente) {
      return protocoloExistente.numero;
    }
    try {
      const protocolo = await this.protocoloService.criarProtocoloDB({
        setor: setor,
        sessao_id: sessaoDB.id,
        estudante_id: sessaoDB.estudante_id,
        assunto: 'Atendimento em tempo real via WhatsApp',
      });
      await this.protocoloService.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: `Atendimento iniciado pelo usuário para o setor: ${setor}`,
        origem: 'SISTEMA',
      });
      return protocolo.numero;
    } catch (error) {
      this.logger.error(
        `[CRIAR_ATENDIMENTO_WHATSAPP] Erro ao criar protocolo para atendimento WhatsApp: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private async buscarNumeroProtocolo(protocoloId: string): Promise<string> {
    try {
      const protocolo = await this.prisma.protocolo.findUnique({
        where: { id: protocoloId },
      });
      return protocolo ? protocolo.numero : null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar número do protocolo: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async processarMensagemWhatsApp(
    sessaoDB: Sessao,
    mensagem: string,
    mediaInfo?: {
      url: string;
      type: 'image' | 'document' | 'video' | 'audio';
      fileName: string;
    },
  ): Promise<void> {
    try {
      console.log(
        'Mensagem recebida do WhatsApp:',
        mensagem,
        'Sessão:',
        sessaoDB,
        'Mídia:',
        mediaInfo,
      );

      const protocolo = await this.prisma.protocolo.findFirst({
        where: { sessao_id: sessaoDB.id, status: 'EM_ATENDIMENTO' },
      });

      if (!protocolo) {
        this.logger.warn(
          `[WHATSAPP -> ATENDENTE] Protocolo não encontrado para sessão ${sessaoDB.id}`,
        );
        return;
      }

      // Emite a mensagem para todos os sockets na sala da sessão
      // Incluindo metadados de mídia se houver
      this.server.to(sessaoDB.id).emit('novaMensagem', {
        sender: 'usuario',
        mensagem,
        mediaUrl: mediaInfo?.url,
        mediaType: mediaInfo?.type,
        fileName: mediaInfo?.fileName,
        origem: 'whatsapp',
      });

      // Registra no histórico do protocolo
      await this.protocoloService.registrarMensagemProtocolo({
        protocolo_id: protocolo.id,
        conteudo: mediaInfo
          ? `[Arquivo: ${mediaInfo.fileName}] ${mensagem}`
          : mensagem,
        origem: 'USUARIO',
      });
    } catch (error) {
      this.logger.error(
        `[WHATSAPP -> ATENDENTE] Erro ao processar mensagem do WhatsApp: ${error.message}`,
        error.stack,
      );
    }
  }
}
