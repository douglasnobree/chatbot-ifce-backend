import { Sessao } from '@prisma/client';

export interface MenuHandler {
  /**
   * Exibe o menu associado ao handler
   */
  exibirMenu(session: Sessao): Promise<void>;

  /**
   * Processa a interação/resposta do usuário
   */
  processarMensagem(session: Sessao, mensagem: string): Promise<void>;
}
