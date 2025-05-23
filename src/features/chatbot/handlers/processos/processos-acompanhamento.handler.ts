import { Injectable, Logger } from '@nestjs/common';
import {  SessionState } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { MenuTexts } from '../../constants/menu-texts';
import { Sessao } from '@prisma/client';

@Injectable()
export class ProcessosAcompanhamentoHandler implements MenuHandler {
  private readonly logger = new Logger(ProcessosAcompanhamentoHandler.name);

  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Exibe o menu de acompanhamento de processos
   */
  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.ACOMPANHAR_PROCESSOS,
    );
  }

  /**
   * Processa a interação do usuário com o menu de acompanhamento de processos
   */
  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    const msgNormalizada = mensagem.trim().toLowerCase();

    switch (msgNormalizada) {
      case '0':
        // Voltar ao menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      case '1':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      case 'consultar':
      case 'processo':
      case 'protocolo':
        // Solicita o número do protocolo a ser consultado
        await this.solicitarNumeroProtocolo(session);
        break;

      default:
        if (session.estado === SessionState.CONSULTANDO_PROTOCOLO) {
          // Tenta interpretar como número de protocolo
          await this.consultarProtocolo(session, mensagem);
        } else {
          // Opção inválida
          await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
            this.exibirMenu(session),
          );
        }
    }
  }

  /**
   * Solicita ao usuário um número de protocolo para consulta
   */
  private async solicitarNumeroProtocolo(session: Sessao): Promise<void> {
    try {
      // Atualiza o estado para esperar pelo número do protocolo
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.CONSULTANDO_PROTOCOLO,
      );

      await this.mensagensService.enviarMensagem(
        session,
        'Por favor, informe o número do protocolo que deseja consultar:',
      );
    } catch (error) {
      this.logger.error(
        `Erro ao solicitar número de protocolo: ${error.message}`,
        error.stack,
      );
      await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
        this.exibirMenu(session),
      );
    }
  }

  /**
   * Consulta um protocolo pelo número informado
   */
  private async consultarProtocolo(
    session: Sessao,
    numeroProtocolo: string,
  ): Promise<void> {
    try {
      const protocolo = numeroProtocolo.trim().replace(/[^\d]/g, '');

      // Retorna ao estado normal
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.ACOMPANHAR_PROCESSOS,
      );

      if (protocolo && /^\d{6}$/.test(protocolo)) {
        // Simulação - Em uma implementação real consultaria o banco de dados
        await this.mensagensService.enviarMensagem(
          session,
          `📋 Protocolo #${protocolo}:\n\nSeu pedido está em processamento. Prazo estimado de conclusão: 5 dias úteis.\n\nDeseja fazer mais alguma coisa?\n0 - Menu principal\n1 - Encerrar atendimento`,
        );
      } else {
        await this.mensagensService.enviarMensagem(
          session,
          'Número de protocolo inválido. Por favor, informe um número de protocolo com 6 dígitos.\n\n0 - Menu principal\n1 - Encerrar atendimento',
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao consultar protocolo: ${error.message}`,
        error.stack,
      );
      await this.operacoesBaseService.exibirMenuPrincipal(session);
    }
  }
}
