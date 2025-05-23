import { Injectable } from '@nestjs/common';
import {  } from '../../entities/session.entity';
import { MenuTexts } from '../../constants/menu-texts';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { MenuHandler } from '../../interfaces/handler.interface';
import { Sessao } from '@prisma/client';

@Injectable()
export class TrancamentoReaberturaHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.TRANCAMENTO_REABERTURA,
    );
  }

  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    switch (mensagem) {
      case '0':
        // Menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      case '1':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      default:
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirMenu(session);
        break;
    }
  }
}

@Injectable()
export class EmitirDocumentosHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.EMITIR_DOCUMENTOS,
    );
  }

  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    switch (mensagem) {
      case '0':
        // Menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      case '1':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      default:
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirMenu(session);
        break;
    }
  }
}

@Injectable()
export class JustificarFaltasHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.JUSTIFICAR_FALTAS,
    );
  }

  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    switch (mensagem) {
      case '0':
        // Menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      case '1':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      default:
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirMenu(session);
        break;
    }
  }
}

@Injectable()
export class AcompanharProcessosHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.ACOMPANHAR_PROCESSOS,
    );
  }

  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    switch (mensagem) {
      case '0':
        // Menu principal
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        break;

      case '1':
        // Encerrar atendimento
        await this.operacoesBaseService.encerrarAtendimento(session);
        break;

      default:
        // Qualquer outra mensagem, exibe o menu novamente
        await this.exibirMenu(session);
        break;
    }
  }
}
