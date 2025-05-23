import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { ChatbotService } from './services/chatbot.service';
import { WhatsappService } from '../whatsapp/service/whatsapp.service';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageService } from './services/message.service';
import { UserDataService } from './services/user-data.service';
import { WhatsAppSessionService } from './services/whatsapp-session.service';
import { MensagensService } from './services/mensagens.service';
import { OperacoesBaseService } from './services/operacoes-base.service';
import { HandlersFactory } from './services/handlers-factory.service';
import { ProtocoloService } from './services/protocolo.service';
import { ValidacaoService } from './services/validacao.service';
import { NotificacoesService } from './services/notificacoes.service';
import { EstatisticasService } from './services/estatisticas-db.service';

// Handlers
import { MainMenuHandler } from './handlers/main-menu.handler';
import { ProtocoloMenuHandler } from './handlers/protocolo/protocolo-menu.handler';
import { ConsultaMatriculaHandler } from './handlers/protocolo/consulta-matricula.handler';
import { AssistenciaEstudantilHandler } from './handlers/assistencia/assistencia-estudantil.handler';
import { CursosIngressoHandler } from './handlers/cursos/cursos-ingresso.handler';
import { ComunicacaoSetoresHandler } from './handlers/comunicacao/comunicacao-setores.handler';
import {
  TrancamentoReaberturaHandler,
  EmitirDocumentosHandler,
  JustificarFaltasHandler,
  AcompanharProcessosHandler,
} from './handlers/protocolo/outros-handlers';
import { RegistroDocumentosHandler } from './handlers/documentos/registro-documentos.handler';
import { ProcessosAcompanhamentoHandler } from './handlers/processos/processos-acompanhamento.handler';
import { AtendimentoGateway } from './handlers/comunicacao/atendimento.gateway';

import { EstatisticasController } from './controllers/estatisticas.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EstatisticasController],
  providers: [
    // Core Services
    SessionService,
    ChatbotService,
    WhatsappService,
    SessionRepository,
    MessageService,
    UserDataService,
    WhatsAppSessionService,
    MensagensService,
    OperacoesBaseService,
    HandlersFactory,
    ProtocoloService,
    ValidacaoService,
    NotificacoesService,
    EstatisticasService,

    // Handlers
    MainMenuHandler,
    ProtocoloMenuHandler,
    ConsultaMatriculaHandler,
    AssistenciaEstudantilHandler,
    CursosIngressoHandler,
    ComunicacaoSetoresHandler,
    TrancamentoReaberturaHandler,
    EmitirDocumentosHandler,
    JustificarFaltasHandler,
    AcompanharProcessosHandler,
    RegistroDocumentosHandler,
    ProcessosAcompanhamentoHandler,
    AtendimentoGateway,
  ],
  exports: [
    ChatbotService,
    SessionService,
    MessageService,
    UserDataService,
    WhatsAppSessionService,
    ProtocoloService,
    ValidacaoService,
    NotificacoesService,
    EstatisticasService,
  ],
})
export class ChatbotModule {}
