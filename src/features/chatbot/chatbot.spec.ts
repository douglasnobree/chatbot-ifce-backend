import { ChatbotService } from './services/chatbot.service';
import { SessionService } from './services/session.service';
import { WhatsappService } from '../whatsapp/service/whatsapp.service';
import { SessionRepository } from './repositories/session.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionState, UserData, Session } from './entities/session.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageService } from './services/message.service';
import { UserDataService } from './services/user-data.service';
import { WhatsAppSessionService } from './services/whatsapp-session.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('ChatbotService', () => {
  let chatbotService: ChatbotService;
  let sessionService: SessionService;
  let messageService: MessageService;
  let userDataService: UserDataService;
  let whatsAppSessionService: WhatsAppSessionService;
  let whatsappService: WhatsappService;
  let sessionRepository: SessionRepository;
  let prismaService: PrismaService;

  // Mock para o WhatsApp service
  const whatsappServiceMock = {
    sendMessage: jest.fn().mockImplementation(() => Promise.resolve(true)),
  };

  // Mock para a sessão
  const mockSession: Session = {
    userId: '558899999999@s.whatsapp.net',
    state: SessionState.MAIN_MENU,
    userData: new UserData(),
    lastInteractionTime: Date.now(),
    instanceId: 'test-instance',
    esperandoResposta: false,
  };
  // Mock para a sessão do WhatsApp
  const mockWhatsAppSession = {
    id: 1,
    InstanceName: 'test-instance',
    numero_telefone: '558899999999',
    status: true,
    jwt_token: 'test-token',
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        ChatbotService,
        SessionService,
        SessionRepository,
        MessageService,
        UserDataService,
        WhatsAppSessionService,
        {
          provide: WhatsappService,
          useValue: whatsappServiceMock,
        },
      ],
    }).compile();

    chatbotService = moduleRef.get<ChatbotService>(ChatbotService);
    sessionService = moduleRef.get<SessionService>(SessionService);
    messageService = moduleRef.get<MessageService>(MessageService);
    userDataService = moduleRef.get<UserDataService>(UserDataService);
    whatsAppSessionService = moduleRef.get<WhatsAppSessionService>(
      WhatsAppSessionService,
    );
    sessionRepository = moduleRef.get<SessionRepository>(SessionRepository);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    whatsappService = moduleRef.get<WhatsappService>(WhatsappService);

    // Spy no método getOrCreateSession
    jest
      .spyOn(sessionService, 'getOrCreateSession')
      .mockImplementation(() => Promise.resolve(mockSession));

    // Spy no método saveMessage
    jest
      .spyOn(messageService, 'saveMessage')
      .mockImplementation(() => Promise.resolve());

    // Spy no método updateSessionState
    jest
      .spyOn(sessionService, 'updateSessionState')
      .mockImplementation((userId, state) => {
        mockSession.state = state;
        return Promise.resolve(mockSession);
      });

    // Spy no método getSessionNameById
    jest
      .spyOn(whatsAppSessionService, 'getSessionNameById')
      .mockImplementation(() => Promise.resolve(mockWhatsAppSession));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    it('deve processar uma mensagem e obter/criar uma sessão', async () => {
      // Arrange
      const userId = '558899999999@s.whatsapp.net';
      const message = '1'; // Opção do menu principal
      const instanceId = 'test-instance';

      // Act
      await chatbotService.processMessage(userId, message, instanceId);

      // Assert      expect(whatsAppSessionService.getSessionNameById).toHaveBeenCalled();
      expect(sessionService.getOrCreateSession).toHaveBeenCalledWith(
        userId,
        instanceId,
      );
      expect(messageService.saveMessage).toHaveBeenCalledWith(
        userId,
        message,
        'USUARIO',
      );
    });

    it('deve processar a mensagem "1" no menu principal e mudar para o menu de protocolo', async () => {
      // Arranjo
      const userId = '558899999999@s.whatsapp.net';
      const message = '1'; // Opção do menu principal para Protocolo
      const instanceId = 'test-instance';

      mockSession.state = SessionState.MAIN_MENU;

      // Act
      await chatbotService.processMessage(userId, message, instanceId);

      // Assert
      expect(sessionService.updateSessionState).toHaveBeenCalledWith(
        userId,
        SessionState.PROTOCOLO_MENU,
      );
      expect(whatsappService.sendMessage).toHaveBeenCalled(); // Deve enviar alguma mensagem de resposta
    });
  });

  describe('Consulta de matrícula', () => {
    it('deve processar a mensagem "1" no menu de protocolo e mudar para consulta de matrícula', async () => {
      // Arrange
      const userId = '558899999999@s.whatsapp.net';
      const message = '1'; // Opção do menu de protocolo para consultar matrícula
      const instanceId = 'test-instance';

      mockSession.state = SessionState.PROTOCOLO_MENU;

      // Act
      await chatbotService.processMessage(userId, message, instanceId);

      // Assert
      expect(sessionService.updateSessionState).toHaveBeenCalledWith(
        userId,
        SessionState.CONSULTAR_MATRICULA,
      );
      expect(whatsappService.sendMessage).toHaveBeenCalled();
    });

    it('deve validar CPF e telefone durante a consulta de matrícula', async () => {
      // Arrange
      const userId = '558899999999@s.whatsapp.net';
      const message = '12345678910, 2345'; // CPF e 4 últimos dígitos do telefone
      const instanceId = 'test-instance';

      mockSession.state = SessionState.ESPERANDO_CPF_TELEFONE; // Mock para o método findUserByCpfAndPhone
      jest
        .spyOn(userDataService, 'findUserByCpfAndPhone')
        .mockImplementation(() =>
          Promise.resolve({
            cpf: '12345678910',
            telefone: '8599992345',
            nome: 'Ana Silva',
            curso: 'Engenharia Civil',
            matricula: '2023123456',
          }),
        );

      // Act
      await chatbotService.processMessage(userId, message, instanceId);

      // Assert
      expect(userDataService.findUserByCpfAndPhone).toHaveBeenCalledWith(
        '12345678910',
        '2345',
      );
      expect(whatsappService.sendMessage).toHaveBeenCalled();
    });
  });
});
