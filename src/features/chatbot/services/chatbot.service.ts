import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { Session, SessionState } from '../entities/session.entity';
import { WhatsappService } from '../../whatsapp/service/whatsapp.service';
import { SendMessageDto } from '../../whatsapp/dto/send-message.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Processa uma mensagem recebida do usuário
   * @param remetente ID do remetente (número de telefone ou grupo)
   * @param mensagem Texto da mensagem
   * @param instanceId ID da instância WhatsApp
   * @param mensagemOriginal Opcional - mensagem original se for uma resposta
   */
  async processMessage(
    remetente: string,
    mensagem: string,
    instanceId: string | number,
    mensagemOriginal?: string,
  ): Promise<void> {
    // Converte instanceId para string se for número
    const instanceIdStr = instanceId.toString();
    try {
      // Obtém ou cria a sessão do usuário
      const { InstanceName } = await this.sessionService.getSessionNameById(
        Number(instanceId),
      );
      const session = await this.sessionService.getOrCreateSession(
        remetente,
        InstanceName,
      );
      console.log('session', session);
      this.logger.log(
        `Processando mensagem do usuário ${remetente} no estado ${session.state}`,
      );

      // Se for uma resposta a outra mensagem, registramos isso no log
      if (mensagemOriginal) {
        this.logger.log(`Mensagem é uma resposta a: "${mensagemOriginal}"`);
      }

      // Salva a mensagem recebida no banco de dados
      await this.sessionService.saveMessage(remetente, mensagem, 'USUARIO');

      // Processa a mensagem com base no estado atual da sessão
      await this.processarMensagemPorEstado(session, mensagem);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Processa a mensagem com base no estado atual da sessão
   */
  private async processarMensagemPorEstado(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    // Normaliza a mensagem (remove espaços extras, converte para minúsculas)
    const msgNormalizada = mensagem.trim().toLowerCase();

    switch (session.state) {
      case SessionState.MAIN_MENU:
        await this.processarMenuPrincipal(session, msgNormalizada);
        break;

      case SessionState.PROTOCOLO_MENU:
        await this.processarMenuProtocolo(session, msgNormalizada);
        break;

      case SessionState.ESPERANDO_CPF_TELEFONE:
        await this.processarConsultaMatricula(session, mensagem);
        break;

      case SessionState.RESULTADO_CONSULTA:
        await this.processarResultadoConsulta(session, msgNormalizada);
        break;

      // Outros casos serão adicionados conforme necessário

      default:
        // Se o estado não for reconhecido, volta para o menu principal
        await this.exibirMenuPrincipal(session);
    }
  }

  /**
   * Processa interações com o menu principal
   */
  private async processarMenuPrincipal(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    switch (mensagem) {
      case '1':
        // Protocolo
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.PROTOCOLO_MENU,
        );
        await this.exibirMenuProtocolo(session);
        break;

      case '2':
        // Assistência Estudantil
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.ASSISTENCIA_ESTUDANTIL,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Assistência Estudantil será implementado em breve.',
        );
        await this.exibirMenuPrincipal(session);
        break;

      case '3':
        // Cursos e Formas de Ingresso
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.CURSOS_INGRESSO,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Cursos e Formas de Ingresso será implementado em breve.',
        );
        await this.exibirMenuPrincipal(session);
        break;

      case '4':
        // Comunicação com os setores
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.COMUNICACAO_SETORES,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Comunicação com os setores será implementado em breve.',
        );
        await this.exibirMenuPrincipal(session);
        break;

      case '5':
        // Encerrar atendimento
        await this.encerrarAtendimento(session);
        break;

      default:
        // Opção inválida
        await this.enviarMensagem(
          session,
          '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.',
        );
        await this.exibirMenuPrincipal(session);
    }
  }

  /**
   * Processa interações com o menu de protocolo
   */
  private async processarMenuProtocolo(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    switch (mensagem) {
      case '1':
        // Consultar número de matrícula
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.CONSULTAR_MATRICULA,
        );
        await this.exibirConsultaMatricula(session);
        break;

      case '2':
        // Trancamento ou reabertura de curso
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.TRANCAMENTO_REABERTURA,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Trancamento ou reabertura de curso será implementado em breve.',
        );
        await this.exibirMenuProtocolo(session);
        break;

      case '3':
        // Emitir documentos
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.EMITIR_DOCUMENTOS,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Emissão de documentos será implementado em breve.',
        );
        await this.exibirMenuProtocolo(session);
        break;

      case '4':
        // Justificar faltas
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.JUSTIFICAR_FALTAS,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Justificativa de faltas será implementado em breve.',
        );
        await this.exibirMenuProtocolo(session);
        break;

      case '5':
        // Acompanhar andamento de processos
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.ACOMPANHAR_PROCESSOS,
        );
        await this.enviarMensagem(
          session,
          'Este módulo de Acompanhamento de processos será implementado em breve.',
        );
        await this.exibirMenuProtocolo(session);
        break;

      case '0':
        // Voltar ao menu principal
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.MAIN_MENU,
        );
        await this.exibirMenuPrincipal(session);
        break;

      default:
        // Opção inválida
        await this.enviarMensagem(
          session,
          '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.',
        );
        await this.exibirMenuProtocolo(session);
    }
  }
  /**
   * Processa o input de CPF e telefone para consulta de matrícula
   */
  private async processarConsultaMatricula(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    // Verifica se é para voltar ao menu principal
    if (mensagem.trim() === '0') {
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.PROTOCOLO_MENU,
      );
      await this.exibirMenuProtocolo(session);
      return;
    }

    // Tenta extrair CPF e telefone
    const partes = mensagem.split(',').map((part) => part.trim());

    if (partes.length !== 2) {
      await this.enviarMensagem(
        session,
        '❌ Formato inválido. Por favor, informe o CPF e os últimos 4 dígitos do telefone separados por vírgula.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal',
      );
      return;
    }

    const cpf = partes[0];
    const telefone = partes[1];

    // Valida CPF (validação simples, apenas verifica se tem 11 dígitos)
    if (!/^\d{11}$/.test(cpf)) {
      await this.enviarMensagem(
        session,
        '❌ CPF inválido. Por favor, informe um CPF com 11 dígitos.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal',
      );
      return;
    }

    // Valida telefone (verifica se tem 4 dígitos)
    if (!/^\d{4}$/.test(telefone)) {
      await this.enviarMensagem(
        session,
        '❌ Telefone inválido. Por favor, informe os últimos 4 dígitos do telefone.\n\nExemplo: 12345678910, 2345\n\n0 - Voltar ao menu principal',
      );
      return;
    }

    try {
      // Busca o usuário no banco de dados
      const usuario = await this.sessionService.findUserByCpfAndPhone(
        cpf,
        telefone,
      );

      // Atualiza o estado da sessão
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.RESULTADO_CONSULTA,
      );

      if (usuario) {
        // Atualizando os dados do usuário na sessão
        await this.sessionService.updateUserData(session.userId, usuario);

        // Exibe os dados encontrados
        await this.enviarMensagem(
          session,
          `✅ Matrícula localizada!\n\nNome: ${usuario.nome}\nCurso: ${usuario.curso}\nMatrícula: ${usuario.matricula}\n\nDeseja fazer mais alguma coisa?\n0 - Menu principal\n1 - Encerrar atendimento`,
        );
      } else {
        // Não encontrou o usuário
        await this.enviarMensagem(
          session,
          `❌ Não encontramos sua matrícula com os dados informados.\n\nPor favor, verifique:\n- CPF digitado corretamente\n- Número de telefone informado é o que está cadastrado na instituição\n\nDeseja tentar novamente?\n1 - Sim\n0 - Voltar ao menu principal`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao consultar matrícula: ${error.message}`,
        error.stack,
      );
      await this.enviarMensagem(
        session,
        `❌ Ocorreu um erro ao consultar sua matrícula. Por favor, tente novamente mais tarde.`,
      );
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.PROTOCOLO_MENU,
      );
      await this.exibirMenuProtocolo(session);
    }
  }

  /**
   * Processa a resposta após consulta de matrícula
   */
  private async processarResultadoConsulta(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    // Verifica se o usuário foi encontrado ou não pelo estado dos dados
    const usuarioEncontrado = !!session.userData.matricula;

    if (usuarioEncontrado) {
      // Fluxo para quando o usuário foi encontrado
      switch (mensagem) {
        case '0':
          // Menu principal
          this.sessionService.updateSessionState(
            session.userId,
            SessionState.MAIN_MENU,
          );
          await this.exibirMenuPrincipal(session);
          break;

        case '1':
          // Encerrar atendimento
          await this.encerrarAtendimento(session);
          break;

        default:
          // Opção inválida
          await this.enviarMensagem(
            session,
            '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.\n\nDeseja fazer mais alguma coisa?\n0 - Menu principal\n1 - Encerrar atendimento',
          );
          break;
      }
    } else {
      // Fluxo para quando o usuário não foi encontrado
      switch (mensagem) {
        case '0':
          // Menu principal
          this.sessionService.updateSessionState(
            session.userId,
            SessionState.PROTOCOLO_MENU,
          );
          await this.exibirMenuProtocolo(session);
          break;

        case '1':
          // Tentar novamente
          this.sessionService.updateSessionState(
            session.userId,
            SessionState.CONSULTAR_MATRICULA,
          );
          await this.exibirConsultaMatricula(session);
          break;

        default:
          // Opção inválida
          await this.enviarMensagem(
            session,
            '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.\n\nDeseja tentar novamente?\n1 - Sim\n0 - Voltar ao menu principal',
          );
          break;
      }
    }
  }

  /**
   * Exibe o menu principal
   */
  private async exibirMenuPrincipal(session: Session): Promise<void> {
    const menuText = `👋 Olá! Bem-vindo(a) ao atendimento virtual do IFCE Campus Tabuleiro do Norte.  
Como posso te ajudar hoje?

1️⃣ Protocolo (Matrícula, Documentos, Trancamento etc)  
2️⃣ Assistência Estudantil  
3️⃣ Cursos e Formas de Ingresso  
4️⃣ Comunicação com os setores  
5️⃣ Encerrar atendimento`;

    // Atualiza o estado da sessão
    this.sessionService.updateSessionState(
      session.userId,
      SessionState.MAIN_MENU,
    );

    // Envia a mensagem
    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe o menu de protocolo
   */
  private async exibirMenuProtocolo(session: Session): Promise<void> {
    const menuText = `Menu de Protocolo
Você selecionou Protocolo. Escolha uma opção:

1 - Consultar número de matrícula  
2 - Trancamento ou a reabertura de curso 
3 - Emitir documentos 
4 - Justificar faltas  
5 - Acompanhar andamento de processos  
0 - Voltar ao menu principal`;

    // Envia a mensagem
    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de consulta de matrícula
   */
  private async exibirConsultaMatricula(session: Session): Promise<void> {
    const menuText = `Consulta por CPF + número de telefone
Para localizar seu número de matrícula, informe:

🧾 CPF (somente números)  
📱 Últimos 4 dígitos do telefone cadastrado

Ex: 12345678910, 2345

0 - Voltar ao menu principal`;

    // Atualiza o estado
    this.sessionService.updateSessionState(
      session.userId,
      SessionState.ESPERANDO_CPF_TELEFONE,
    );

    // Envia a mensagem
    await this.enviarMensagem(session, menuText);
  }

  /**
   * Encerra o atendimento
   */
  private async encerrarAtendimento(session: Session): Promise<void> {
    this.sessionService.updateSessionState(
      session.userId,
      SessionState.ENCERRAMENTO,
    );

    await this.enviarMensagem(
      session,
      '👍 Atendimento encerrado. Obrigado por utilizar nosso serviço! Caso precise de ajuda novamente, é só enviar uma mensagem.',
    );

    // Limpa a sessão após encerrar o atendimento
    this.sessionService.encerrarSessao(session.userId);
  }

  /**
   * Envia uma mensagem para o usuário
   */
  private async enviarMensagem(session: Session, texto: string): Promise<void> {
    try {
      // Prepara os dados da mensagem
      const mensagem: SendMessageDto = {
        number: session.userId.split('@')[0], // Remove o sufixo @s.whatsapp.net
        textMessage: {
          text: texto,
        },
      };

      // Envia a mensagem
      await this.whatsappService.sendMessage(mensagem, session.instanceId);

      this.logger.log(`Mensagem enviada para ${session.userId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Tarefa cron para limpar sessões expiradas periodicamente
   */
  @Cron('0 */5 * * * *') // Executa a cada 5 minutos
  async handleSessionCleanup() {
    this.logger.debug('Executando limpeza de sessões expiradas');
    const cleanedSessions = await this.sessionService.cleanExpiredSessions();

    if (cleanedSessions > 0) {
      this.logger.log(`${cleanedSessions} sessões expiradas foram limpas`);
    }
  }
}
