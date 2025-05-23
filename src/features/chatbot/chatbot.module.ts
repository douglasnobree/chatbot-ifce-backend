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

@Module({
  imports: [PrismaModule],
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
  ],
  exports: [
    ChatbotService,
    SessionService,
    MessageService,
    UserDataService,
    WhatsAppSessionService,
  ],
})
export class ChatbotModule {}
