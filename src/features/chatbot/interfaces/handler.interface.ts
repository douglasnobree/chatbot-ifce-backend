import { Session } from '../entities/session.entity';

export interface MenuHandler {
  /**
   * Exibe o menu associado ao handler
   */
  exibirMenu(session: Session): Promise<void>;

  /**
   * Processa a interação/resposta do usuário
   */
  processarMensagem(session: Session, mensagem: string): Promise<void>;
}
