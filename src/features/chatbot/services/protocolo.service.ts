import { Injectable, Logger } from '@nestjs/common';
import { MensagensService } from './mensagens.service';
import { SessionService } from './session.service';
import { UserDataService } from './user-data.service';
import { MenuTexts, SuccessMessages } from '../constants/menu-texts';
import { Sessao } from '@prisma/client';

@Injectable()
export class ProtocoloService {
  private readonly logger = new Logger(ProtocoloService.name);

  constructor(
    private readonly mensagensService: MensagensService,
    private readonly sessionService: SessionService,
    private readonly userDataService: UserDataService,
  ) {}

  /**
   * Gera um novo número de protocolo para um atendimento
   * @returns Número de protocolo gerado
   */
  gerarNumeroProtocolo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Registra um protocolo de atendimento
   * @param session Sessão do usuário
   * @param setor Setor de destino do protocolo
   * @param descricao Descrição do protocolo
   */
  async registrarProtocolo(
    session: Sessao,
    setor: string,
    descricao?: string,
  ): Promise<string> {
    try {
      // Gera um número de protocolo
      const numeroProtocolo = this.gerarNumeroProtocolo();

      this.logger.log(
        `Protocolo ${numeroProtocolo} gerado para usuário ${session.userId} - Setor: ${setor}`,
      );

      // Em uma implementação real, aqui registraria no banco de dados

      return numeroProtocolo;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar protocolo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Confirma protocolo e envia mensagem de confirmação
   * @param session Sessão do usuário
   * @param setor Setor do protocolo
   */
  async confirmarProtocolo(session: Sessao, setor: string): Promise<void> {
    try {
      const numeroProtocolo = await this.registrarProtocolo(session, setor);

      // Envia a mensagem de confirmação ao usuário
      await this.mensagensService.enviarMensagem(
        session,
        SuccessMessages.PROTOCOLO_GERADO(setor, numeroProtocolo),
      );
    } catch (error) {
      this.logger.error(
        `Erro ao confirmar protocolo: ${error.message}`,
        error.stack,
      );

      // Em caso de erro, envia uma mensagem genérica
      await this.mensagensService.enviarMensagem(
        session,
        'Desculpe, ocorreu um erro ao registrar seu protocolo. Por favor, tente novamente mais tarde.',
      );
    }
  }
}
