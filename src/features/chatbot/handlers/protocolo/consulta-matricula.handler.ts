import { Injectable, Logger } from '@nestjs/common';
import { SessionState } from '../../entities/session.entity';
import { MenuHandler } from '../../interfaces/handler.interface';
import { SessionService } from '../../services/session.service';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { UserDataService } from '../../services/user-data.service';
import { CSVMatriculasService } from '../../services/csv-matriculas.service';
import {
  MenuTexts,
  ErrorMessages,
  SuccessMessages,
} from '../../constants/menu-texts';
import { Sessao } from '@prisma/client';

@Injectable()
export class ConsultaMatriculaHandler implements MenuHandler {
  private readonly logger = new Logger(ConsultaMatriculaHandler.name);
  constructor(
    private readonly sessionService: SessionService,
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly userDataService: UserDataService,
    private readonly csvMatriculasService: CSVMatriculasService,
  ) {}

  /**
   * Exibe o menu de consulta de matrícula
   */
  async exibirMenu(session: Sessao): Promise<void> {
    await this.mensagensService.enviarMensagem(
      session,
      MenuTexts.CONSULTA_MATRICULA,
    );

    // Atualiza o estado da sessão para esperar o input
    await this.sessionService.updateSessionState(
      session.userId,
      SessionState.ESPERANDO_CPF_TELEFONE,
    );
  }

  /**
   * Processa a entrada do usuário com CPF e telefone
   */
  async processarMensagem(session: Sessao, mensagem: string): Promise<void> {
    // Verificar se estamos no estado de esperar dados ou de mostrar resultados
    if (session.estado === SessionState.ESPERANDO_CPF_TELEFONE) {
      await this.processarEntradaCpfTelefone(session, mensagem);
    } else if (session.estado === SessionState.RESULTADO_CONSULTA) {
      await this.processarResultadoConsulta(session, mensagem);
    }
  }

  /**
   * Processa o input de CPF
   */
  private async processarEntradaCpfTelefone(
    session: Sessao,
    mensagem: string,
  ): Promise<void> {
    // Verifica se é para voltar ao menu principal
    if (mensagem.trim() === '0') {
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.PROTOCOLO_MENU,
      );
      await this.mensagensService.enviarMensagem(
        session,
        MenuTexts.PROTOCOLO_MENU,
      );
      return;
    }

    const cpf = mensagem.trim();

    // Valida CPF (validação simples, apenas verifica se tem 11 dígitos)
    if (!/^\d{11}$/.test(cpf)) {
      await this.mensagensService.enviarMensagem(
        session,
        ErrorMessages.CPF_INVALIDO,
      );
      return;
    }

    try {
      // Busca o estudante no arquivo CSV
      const estudante = await this.csvMatriculasService.buscarEstudantePorCPF(cpf);

      // Atualiza o estado da sessão
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.RESULTADO_CONSULTA,
      );

      if (estudante) {
        // Atualizando os dados do usuário na sessão
        const dadosEstudante = {
          nome: estudante.Nome,
          curso: estudante.Curso,
          matricula: estudante.Matricula,
          cpf: estudante.CPF,
          telefone: estudante.Numero_telefone
        };
        
        await this.userDataService.updateUserData(session.userId, dadosEstudante);

        // Exibe os dados encontrados
        await this.mensagensService.enviarMensagem(
          session,
          SuccessMessages.MATRICULA_LOCALIZADA(
            estudante.Nome,
            estudante.Curso,
            estudante.Matricula,
          ),
        );
      } else {
        // Não encontrou o usuário
        await this.mensagensService.enviarMensagem(
          session,
          ErrorMessages.MATRICULA_NAO_ENCONTRADA,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao consultar matrícula: ${error.message}`,
        error.stack,
      );
      await this.mensagensService.enviarMensagem(
        session,
        ErrorMessages.ERRO_CONSULTA,
      );
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.PROTOCOLO_MENU,
      );
      await this.mensagensService.enviarMensagem(
        session,
        MenuTexts.PROTOCOLO_MENU,
      );
    }
  }

  /**
   * Processa a resposta após consulta de matrícula
   */
  private async processarResultadoConsulta(
    session: Sessao,
    mensagem: string,
  ): Promise<void> {
    // Verifica se o usuário foi encontrado ou não pelo estado dos dados
    const usuarioEncontrado = !!session.estudante_id;

    if (usuarioEncontrado) {
      // Fluxo para quando o usuário foi encontrado
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
          // Opção inválida
          await this.mensagensService.enviarMensagem(
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
          await this.sessionService.updateSessionState(
            session.userId,
            SessionState.PROTOCOLO_MENU,
          );
          await this.mensagensService.enviarMensagem(
            session,
            MenuTexts.PROTOCOLO_MENU,
          );
          break;

        case '1':
          // Tentar novamente
          await this.exibirMenu(session);
          break;

        default:
          // Opção inválida
          await this.mensagensService.enviarMensagem(
            session,
            '❌ Opção inválida. Por favor, envie apenas o número da opção desejada.\n\nDeseja tentar novamente?\n1 - Sim\n0 - Voltar ao menu principal',
          );
          break;
      }
    }
  }
}
