import { Injectable } from '@nestjs/common';
import { Session } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { MenuTexts } from '../../constants/menu-texts';

@Injectable()
export class CursosIngressoHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
  ) {}

  /**
   * Exibe o menu de cursos e formas de ingresso
   */
  async exibirMenu(session: Session): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.CURSOS_INGRESSO,
    );
  }

  /**
   * Processa a interação do usuário com o menu de cursos e ingresso
   */
  async processarMensagem(session: Session, mensagem: string): Promise<void> {
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
        // Qualquer outra mensagem, exibe o menu novamente
        await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
          this.exibirMenu(session),
        );
    }
  }
}
