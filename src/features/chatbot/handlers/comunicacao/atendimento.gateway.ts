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

interface ChatMessage {
  sender: 'usuario' | 'atendente';
  nome?: string;
  setor?: string;
  mensagem: string;
}

@WebSocketGateway({ cors: true })
export class AtendimentoGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Mapeia sessões: sessionId -> socketId do usuário e do atendente
  private sessions: Record<
    string,
    {
      usuario?: string;
      atendente?: string;
      setor?: string;
      nomeAtendente?: string;
    }
  > = {};

  handleConnection(client: Socket) {
    // Pode adicionar lógica de autenticação aqui
  }

  handleDisconnect(client: Socket) {
    // Remove o socket das sessões
    for (const sessionId in this.sessions) {
      if (this.sessions[sessionId].usuario === client.id) {
        delete this.sessions[sessionId];
      }
      if (this.sessions[sessionId].atendente === client.id) {
        this.sessions[sessionId].atendente = undefined;
        this.sessions[sessionId].nomeAtendente = undefined;
      }
    }
  }

  // Usuário inicia sessão de atendimento
  @SubscribeMessage('iniciarAtendimento')
  handleIniciarAtendimento(
    @MessageBody() data: { sessionId: string; setor: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.sessions[data.sessionId] = { usuario: client.id, setor: data.setor };
    client.join(data.sessionId);
    this.server
      .to(client.id)
      .emit('atendimentoAguardando', { message: 'Aguardando um atendente...' });
  }

  // Atendente entra na sessão
  @SubscribeMessage('entrarAtendimento')
  handleEntrarAtendimento(
    @MessageBody() data: { sessionId: string; nome: string; setor: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.sessions[data.sessionId]) return;
    this.sessions[data.sessionId].atendente = client.id;
    this.sessions[data.sessionId].nomeAtendente = data.nome;
    this.sessions[data.sessionId].setor = data.setor;
    client.join(data.sessionId);
    this.server
      .to(data.sessionId)
      .emit('atendenteEntrou', { nome: data.nome, setor: data.setor });
  }

  // Envio de mensagem
  @SubscribeMessage('enviarMensagem')
  handleEnviarMensagem(
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
    } else {
      mensagemFormatada = data.mensagem;
    }
    this.server.to(data.sessionId).emit('novaMensagem', {
      sender: data.sender,
      mensagem: mensagemFormatada,
    });
  }

  // Listar atendimentos abertos para o painel do atendente
  @SubscribeMessage('listarAtendimentos')
  handleListarAtendimentos(_: any, @ConnectedSocket() client: Socket) {
    // Retorna sessões que têm usuário mas não atendente
    const abertos = Object.entries(this.sessions)
      .filter(([_, s]) => s.usuario && !s.atendente)
      .map(([sessionId, s]) => ({ sessionId, setor: s.setor }));
    client.emit('atendimentosAbertos', abertos);
  }
}
