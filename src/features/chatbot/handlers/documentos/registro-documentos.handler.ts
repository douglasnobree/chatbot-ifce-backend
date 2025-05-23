import { Injectable, Logger } from '@nestjs/common';
import {  SessionState } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { ValidacaoService } from '../../services/validacao.service';
import { ProtocoloService } from '../../services/protocolo.service';
import { MenuTexts } from '../../constants/menu-texts';
import { Sessao } from '@prisma/client';

@Injectable()
export class RegistroDocumentosHandler implements MenuHandler {
  private readonly logger = new Logger(RegistroDocumentosHandler.name);

  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly sessionService: SessionService,
    private readonly validacaoService: ValidacaoService,
    private readonly protocoloService: ProtocoloService,
  ) {}

  /**
   * Exibe o menu de registro de documentos
   */
  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.EMITIR_DOCUMENTOS,
    );
  }

  /**
   * Processa a interação do usuário com o menu de documentos
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

      default:
        if (session.estado === SessionState.REGISTRO_DOCUMENTO_PENDENTE) {
          // Processa o formulário enviado pelo usuário
          await this.processarFormularioDocumentos(session, mensagem);
        } else {
          // Exibe menu novamente se a opção for inválida
          await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
            this.exibirMenu(session),
          );
        }
    }
  }

  /**
   * Processa o formulário de documentos enviado pelo usuário
   */
  private async processarFormularioDocumentos(
    session: Sessao,
    mensagem: string,
  ): Promise<void> {
    try {
      // Extrai dados do formulário
      const dadosFormulario =
        this.validacaoService.extrairDadosFormulario(mensagem);

      // Verifica se tem dados suficientes
      if (Object.keys(dadosFormulario).length > 0) {
        // Gera um protocolo para o registro de documentos
        await this.protocoloService.confirmarProtocolo(
          session,
          'Registro de Documentos',
        );

        // Atualiza o estado para o menu principal
        await this.sessionService.updateSessionState(
          session.userId,
          SessionState.MAIN_MENU,
        );
      } else {
        // Pede para o usuário fornecer mais informações
        await this.mensagensService.enviarMensagem(
          session,
          'Por favor forneça mais detalhes sobre o documento que deseja registrar.',
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar formulário de documentos: ${error.message}`,
        error.stack,
      );

      await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
        this.exibirMenu(session),
      );
    }
  }
}
