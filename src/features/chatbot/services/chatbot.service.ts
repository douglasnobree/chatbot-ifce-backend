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

      case SessionState.TRANCAMENTO_REABERTURA:
        await this.processarTrancamentoReabertura(session, msgNormalizada);
        break;

      case SessionState.EMITIR_DOCUMENTOS:
        await this.processarEmitirDocumentos(session, msgNormalizada);
        break;

      case SessionState.JUSTIFICAR_FALTAS:
        await this.processarJustificarFaltas(session, msgNormalizada);
        break;

      case SessionState.ACOMPANHAR_PROCESSOS:
        await this.processarAcompanharProcessos(session, msgNormalizada);
        break;

      case SessionState.ASSISTENCIA_ESTUDANTIL:
        await this.processarAssistenciaEstudantil(session, msgNormalizada);
        break;

      case SessionState.CURSOS_INGRESSO:
        await this.processarCursosIngresso(session, msgNormalizada);
        break;

      case SessionState.COMUNICACAO_SETORES:
        await this.processarComunicacaoSetores(session, msgNormalizada);
        break;

      // Outros casos serão adicionados conforme necessário

      default:
        // Se o estado não for reconhecido, volta para o menu principal
        await this.exibirMenuPrincipal(session);
    }
  }

  /**
   * Processa interações com o menu principal
   */ private async processarMenuPrincipal(
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
        await this.exibirAssistenciaEstudantil(session);
        break;

      case '3':
        // Cursos e Formas de Ingresso
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.CURSOS_INGRESSO,
        );
        await this.exibirCursosIngresso(session);
        break;

      case '4':
        // Comunicação com os setores
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.COMUNICACAO_SETORES,
        );
        await this.exibirComunicacaoSetores(session);
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
   */ private async processarMenuProtocolo(
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
        await this.exibirTrancamentoReabertura(session);
        break;

      case '3':
        // Emitir documentos
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.EMITIR_DOCUMENTOS,
        );
        await this.exibirEmitirDocumentos(session);
        break;

      case '4':
        // Justificar faltas
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.JUSTIFICAR_FALTAS,
        );
        await this.exibirJustificarFaltas(session);
        break;

      case '5':
        // Acompanhar andamento de processos
        this.sessionService.updateSessionState(
          session.userId,
          SessionState.ACOMPANHAR_PROCESSOS,
        );
        await this.exibirAcompanharProcessos(session);
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
  @Cron('0 */1 * * * *') // Executa a cada 5 minutos
  async handleSessionCleanup() {
    this.logger.debug('Executando limpeza de sessões expiradas');
    const cleanedSessions = await this.sessionService.cleanExpiredSessions();

    if (cleanedSessions > 0) {
      this.logger.log(`${cleanedSessions} sessões expiradas foram limpas`);
    }
  }

  /**
   * Processa interações com o módulo de trancamento ou reabertura de curso
   */
  private async processarTrancamentoReabertura(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirTrancamentoReabertura(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de emissão de documentos
   */
  private async processarEmitirDocumentos(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirEmitirDocumentos(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de justificativa de faltas
   */
  private async processarJustificarFaltas(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirJustificarFaltas(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de acompanhamento de processos
   */
  private async processarAcompanharProcessos(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirAcompanharProcessos(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de assistência estudantil
   */
  private async processarAssistenciaEstudantil(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirAssistenciaEstudantil(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de cursos e formas de ingresso
   */
  private async processarCursosIngresso(
    session: Session,
    mensagem: string,
  ): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirCursosIngresso(session);
        break;
    }
  }

  /**
   * Processa interações com o módulo de comunicação com os setores
   */
  private async processarComunicacaoSetores(
    session: Session,
    mensagem: string,
  ): Promise<void> {
    // Se o estado for para coletar qual setor o usuário deseja falar
    if (!session.userData.escolhaSetor) {
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
          // Comunicação
          await this.sessionService.updateUserData(session.userId, {
            escolhaSetor: 'Comunicação',
          });
          await this.exibirColetaDadosAtendimento(session);
          break;

        case '2':
          // Diretoria
          await this.sessionService.updateUserData(session.userId, {
            escolhaSetor: 'Diretoria',
          });
          await this.exibirColetaDadosAtendimento(session);
          break;

        case '3':
          // Coordenação
          await this.sessionService.updateUserData(session.userId, {
            escolhaSetor: 'Coordenação',
          });
          await this.exibirColetaDadosAtendimento(session);
          break;

        case '4':
          // Secretaria
          await this.sessionService.updateUserData(session.userId, {
            escolhaSetor: 'Secretaria',
          });
          await this.exibirColetaDadosAtendimento(session);
          break;

        default:
          // Opção inválida
          await this.enviarMensagem(
            session,
            '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.',
          );
          await this.exibirComunicacaoSetores(session);
          break;
      }
    } else {
      // Estado para finalizar o processo e registrar o pedido
      switch (mensagem) {
        case '0':
          // Menu principal
          this.sessionService.updateSessionState(
            session.userId,
            SessionState.MAIN_MENU,
          );
          await this.exibirMenuPrincipal(session);
          break;

        default:
          // Assume que é a resposta com os dados
          // Gerar um número de protocolo aleatório para demonstração
          const numeroProtocolo = Math.floor(100000 + Math.random() * 900000);

          await this.enviarMensagem(
            session,
            `✅ Pronto! Seu pedido foi registrado e você será encaminhado para o setor de ${session.userData.escolhaSetor}.\n\n🔁 Aguarde um momento. Assim que um atendente estiver disponível, ele iniciará a conversa por aqui mesmo.\n\n📌 Número do protocolo: #${numeroProtocolo}\n(Salve este número caso precise acompanhar ou retomar o atendimento)\n\nCaso deseje voltar ao menu principal, digite \`0\`.`,
          );
          break;
      }
    }
  }

  /**
   * Exibe a tela de trancamento ou reabertura de curso
   */
  private async exibirTrancamentoReabertura(session: Session): Promise<void> {
    const menuText = `📌 Para solicitar trancamento ou reabertura de matrícula/disciplina, siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No corpo do e-mail, informe:
Qual procedimento que deseja solicitar (Trancamento ou reabertura de matrícula, ou de uma disciplina);
Nome;
Curso;
E-mail;
Turno/Polo;
Matrícula;
CPF;
Telefone;

📨 Após o envio, o setor de protocolo encaminharà a solicitação para o sistema. Para saber mais, entre em contato com o setor de atendimento do campus presencialmente.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de emissão de documentos
   */
  private async exibirEmitirDocumentos(session: Session): Promise<void> {
    const menuText = `📌 Para solicitar documentos (Diploma, por exemplo), siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No e-mail, anexe os seguintes documentos:
RG/CPF;
Certidão de Nascimento/Casamento;
Título de eleitor;
Quitação Eleitoral;
Reservista(sexo masculino);
Nada consta da biblioteca; 

📨 Após o envio, o setor de protocolo encaminhará a emissão do documento. Para saber mais, entre em contato com o setor de atendimento do campus presencialmente.

📌 Para solicitar documentos como boletim, declarações, histórico escolar, siga estas orientações:

1️⃣ Acesse o link do Q-Acadêmico: https://qacademico.ifce.edu.br
2️⃣ Realize o login com sua matrícula e senha
3️⃣ Na tela inicial, clique em "Solicitar documentos"
4️⃣ Em seguida, clique em "Nova Solitação

Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento"

`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de justificativa de faltas
   */
  private async exibirJustificarFaltas(session: Session): Promise<void> {
    const menuText = `📌 Para justificar sua falta, siga estas orientações:

1️⃣ Envie um e-mail para: protocolo.tabuleiro@ifce.edu.br
2️⃣ No e-mail, anexe um documento comprobatório (ex: atestado médico ou declaração da empresa)  
3️⃣ No corpo do e-mail, informe os seguintes dados:
   - Nome completo  
   - Telefone  
   - Curso  
   - Número de matrícula  

📨 Após o envio, o setor de protocolo analisará sua justificativa.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de acompanhamento de processos
   */
  private async exibirAcompanharProcessos(session: Session): Promise<void> {
    const menuText = `📌 Para se atualizar de algum processo que tenha solicitado, siga estas orientações:

1️⃣ Acesse o site do SEI (Sistema Eletrônico de Informações): https://sei.ifce.edu.br/sei/modulos/pesquisa/md_pesq_processo_pesquisar.php?acao_externa=protocolo_pesquisar&acao_origem_externa=protocolo_pesquisar&id_orgao_acesso_externo=0
2️⃣ Ao acessar, preencha os campos necessários do formulário para realizar a busca.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de assistência estudantil
   */
  private async exibirAssistenciaEstudantil(session: Session): Promise<void> {
    const menuText = `📚 Assistência Estudantil - IFCE Campus Tabuleiro do Norte

Para informações sobre auxílios, bolsas e programas de assistência estudantil, entre em contato com o setor:

📞 Telefone: (85) 2222-0023
🔗 Link de atendimento: bit.ly/falarcomCAE2

Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de cursos e formas de ingresso
   */
  private async exibirCursosIngresso(session: Session): Promise<void> {
    const menuText = `🎓 Aqui você encontra informações sobre os cursos e como ingressar na instituição:

📘 Cursos Disponíveis 
Confira todos os cursos oferecidos atualmente no campus pelo link abaixo:  
🔗 https://ifce.edu.br/tabuleirodonorte/campus_tabuleiro/cursos

📝 Formas de Ingresso  
Conheça as formas de ingresso disponíveis (ENEM, vestibular, transferência, etc):  
🔗 https://ifce.edu.br/acesso-rapido/seja-nosso-aluno/

❓ Caso tenha dúvidas, você pode falar com a equipe da secretaria.


Deseja fazer mais alguma coisa?
0 - Menu principal
1 - Encerrar atendimento`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de comunicação com os setores
   */
  private async exibirComunicacaoSetores(session: Session): Promise<void> {
    // Resetar a escolha do setor
    await this.sessionService.updateUserData(session.userId, {
      escolhaSetor: null,
    });

    const menuText = `👤 Você deseja falar com um atendente humano.  
Por favor, informe com qual setor deseja conversar:

1 - Comunicação  
2 - Diretoria  
3 - Coordenação  
4 - Secretaria  
0 - Voltar ao menu principal`;

    await this.enviarMensagem(session, menuText);
  }

  /**
   * Exibe a tela de coleta de dados para atendimento
   */
  private async exibirColetaDadosAtendimento(session: Session): Promise<void> {
    const menuText = `Antes de te encaminhar para o setor ${session.userData.escolhaSetor}, preciso confirmar algumas informações:

🧍 Nome completo:  
📞 Telefone:  
📧 E-mail:  
🎓 Curso (se aplicável):  

0 - Voltar ao menu principal`;

    await this.enviarMensagem(session, menuText);
  }
}
