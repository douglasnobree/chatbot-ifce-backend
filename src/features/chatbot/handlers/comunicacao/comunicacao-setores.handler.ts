import { Injectable } from '@nestjs/common';
import { Session, SessionState } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { UserDataService } from '../../services/user-data.service';
import { MenuTexts, SuccessMessages } from '../../constants/menu-texts';

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
  async exibirMenu(session: Session): Promise<void> {
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
  async processarMensagem(session: Session, mensagem: string): Promise<void> {
    const msgNormalizada = mensagem.trim().toLowerCase();

    // Se o estado for para coletar qual setor o usuário deseja falar
    if (!session.userData.escolhaSetor) {
      switch (msgNormalizada) {
        case '0':
          // Voltar ao menu principal
          await this.operacoesBaseService.voltarMenuPrincipal(session);
          break;

        case '1': // Comunicação
          await this.userDataService.updateUserData(session.userId, {
            escolhaSetor: 'Comunicação',
          });
          await this.exibirColetaDadosAtendimento(session, 'Comunicação');
          break;

        case '2': // Diretoria
          await this.userDataService.updateUserData(session.userId, {
            escolhaSetor: 'Diretoria',
          });
          await this.exibirColetaDadosAtendimento(session, 'Diretoria');
          break;

        case '3': // Coordenação
          await this.userDataService.updateUserData(session.userId, {
            escolhaSetor: 'Coordenação',
          });
          await this.exibirColetaDadosAtendimento(session, 'Coordenação');
          break;

        case '4': // Secretaria
          await this.userDataService.updateUserData(session.userId, {
            escolhaSetor: 'Secretaria',
          });
          await this.exibirColetaDadosAtendimento(session, 'Secretaria');
          break;

        default:
          // Opção inválida
          await this.operacoesBaseService.exibirOpcaoInvalida(session, () =>
            this.exibirMenu(session),
          );
          break;
      }
    } else {
      // Estado para finalizar o processo e registrar o pedido
      switch (msgNormalizada) {
        case '0':
          // Menu principal
          await this.operacoesBaseService.voltarMenuPrincipal(session);
          break;

        default:
          // Assume que é a resposta com os dados
          // Gerar um número de protocolo aleatório para demonstração
          const numeroProtocolo = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          await this.mensagensService.enviarMensagem(
            session,
            SuccessMessages.PROTOCOLO_GERADO(
              session.userData.escolhaSetor,
              numeroProtocolo,
            ),
          );
          break;
      }
    }
  }

  /**
   * Exibe tela de coleta de dados para atendimento
   */
  private async exibirColetaDadosAtendimento(
    session: Session,
    setor: string,
  ): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.COLETA_DADOS_ATENDIMENTO(setor),
    );
  }
}
