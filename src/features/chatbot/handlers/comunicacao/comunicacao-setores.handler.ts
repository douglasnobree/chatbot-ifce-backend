import { Injectable } from '@nestjs/common';
import { Sessao, Estudante } from '@prisma/client';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { UserDataService } from '../../services/user-data.service';
import { MenuTexts, SuccessMessages } from '../../constants/menu-texts';
import { SessionState } from '../../entities/session.entity';

@Injectable()
export class ComunicacaoSetoresHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly sessionService: SessionService,
    private readonly userDataService: UserDataService,
  ) {}

  /**
   * Exibe o menu de comunicação com os setores
   */
  async exibirMenu(session: Sessao): Promise<void> {
    // Resetar a escolha do setor
    await this.userDataService.updateUserData(session.userId, {
      escolhaSetor: null,
    });

    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.COMUNICACAO_SETORES,
    );
  }

  /**
   * Processa a interação do usuário com o menu de comunicação com setores
   */
  async processarMensagem(
    session: Sessao & { estudante?: Estudante },
    mensagem: string,
  ): Promise<void> {
    // Se a sessão está em atendimento humano, o bot não responde mais
    if (session.estado === SessionState.ATENDIMENTO_HUMANO) {
      return;
    }
    const msgNormalizada = mensagem.trim().toLowerCase();

    // Se o estado for para coletar qual setor o usuário deseja falar
    if (!session.estudante || !session.estudante.escolhaSetor) {
      switch (msgNormalizada) {
        case '0':
          await this.operacoesBaseService.voltarMenuPrincipal(session);
          break;
        case '1': // Comunicação
          await this.userDataService.updateUserData(
            session.userId,
            { escolhaSetor: 'Comunicação' },
            session,
          );
          if (session.estudante) session.estudante.escolhaSetor = 'Comunicação';
          await this.exibirColetaDadosAtendimento(session, 'Comunicação');
          session.estado = SessionState.AGUARDANDO_DADOS_ATENDIMENTO;
          await this.sessionService.updateSessionState(
            session.userId,
            SessionState.AGUARDANDO_DADOS_ATENDIMENTO,
          );
          break;
        case '2': // Diretoria
          await this.userDataService.updateUserData(
            session.userId,
            { escolhaSetor: 'Diretoria' },
            session,
          );
          if (session.estudante) session.estudante.escolhaSetor = 'Diretoria';
          await this.exibirColetaDadosAtendimento(session, 'Diretoria');
          session.estado = SessionState.AGUARDANDO_DADOS_ATENDIMENTO;
          await this.sessionService.updateSessionState(
            session.userId,
            SessionState.AGUARDANDO_DADOS_ATENDIMENTO,
          );
          break;
        case '3': // Coordenação
          await this.userDataService.updateUserData(
            session.userId,
            { escolhaSetor: 'Coordenação' },
            session,
          );
          if (session.estudante) session.estudante.escolhaSetor = 'Coordenação';
          await this.exibirColetaDadosAtendimento(session, 'Coordenação');
          session.estado = SessionState.AGUARDANDO_DADOS_ATENDIMENTO;
          await this.sessionService.updateSessionState(
            session.userId,
            SessionState.AGUARDANDO_DADOS_ATENDIMENTO,
          );
          break;
        case '4': // Secretaria
          await this.userDataService.updateUserData(
            session.userId,
            { escolhaSetor: 'Secretaria' },
            session,
          );
          if (session.estudante) session.estudante.escolhaSetor = 'Secretaria';
          await this.exibirColetaDadosAtendimento(session, 'Secretaria');
          session.estado = SessionState.AGUARDANDO_DADOS_ATENDIMENTO;
          await this.sessionService.updateSessionState(
            session.userId,
            SessionState.AGUARDANDO_DADOS_ATENDIMENTO,
          );
          break;
        default:
          await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
            this.exibirMenu(session),
          );
          break;
      }
    } else if (session.estado === SessionState.AGUARDANDO_DADOS_ATENDIMENTO) {
      if (msgNormalizada === '0') {
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        return;
      }
      const numeroProtocolo = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await this.mensagensService.enviarMensagem(
        session,
        SuccessMessages.PROTOCOLO_GERADO(
          session.estudante?.escolhaSetor || '',
          numeroProtocolo,
        ),
      );
      session.estado = SessionState.ATENDIMENTO_HUMANO;
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.ATENDIMENTO_HUMANO,
      );
      await this.mensagensService.enviarMensagem(
        session,
        `Aguarde, um atendente humano irá entrar no chat em instantes. Quando o atendente entrar, você será avisado aqui!\nSeu protocolo: ${numeroProtocolo}`,
      );
      return;
    } else {
      // fallback para compatibilidade retroativa
      if (msgNormalizada === '0') {
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        return;
      }
      const numeroProtocolo = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await this.mensagensService.enviarMensagem(
        session,
        SuccessMessages.PROTOCOLO_GERADO(
          session.estudante?.escolhaSetor || '',
          numeroProtocolo,
        ),
      );
      session.estado = SessionState.ATENDIMENTO_HUMANO;
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.ATENDIMENTO_HUMANO,
      );
      await this.mensagensService.enviarMensagem(
        session,
        `Aguarde, um atendente humano irá entrar no chat em instantes. Quando o atendente entrar, você será avisado aqui!\nSeu protocolo: ${numeroProtocolo}`,
      );
      return;
    }
  }

  /**
   * Exibe tela de coleta de dados para atendimento
   */
  private async exibirColetaDadosAtendimento(
    session: Sessao,
    setor: string,
  ): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.COLETA_DADOS_ATENDIMENTO(setor),
    );
    // Atualiza o estado da sessão para coletar dados do atendimento
    await this.sessionService.updateSessionState(
      session.userId,
      SessionState.AGUARDANDO_DADOS_ATENDIMENTO,
    );
  }
}
