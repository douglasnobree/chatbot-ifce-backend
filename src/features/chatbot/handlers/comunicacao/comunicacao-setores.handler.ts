import { Injectable } from '@nestjs/common';
import { Sessao, Estudante } from '@prisma/client';
import { MenuHandler } from '../../interfaces/handler.interface';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { UserDataService } from '../../services/user-data.service';
import { MenuTexts, SuccessMessages } from '../../constants/menu-texts';
import { SessionState } from '../../entities/session.entity';
import { ProtocoloService } from '../../services/protocolo.service';
import { AtendimentoGateway } from './atendimento.gateway';
import axios from 'axios';
import * as yaml from 'js-yaml';

@Injectable()
export class ComunicacaoSetoresHandler implements MenuHandler {
  constructor(
    private readonly mensagensService: MensagensService,
    private readonly operacoesBaseService: OperacoesBaseService,
    private readonly sessionService: SessionService,
    private readonly userDataService: UserDataService,
    private readonly protocoloService: ProtocoloService,
    private readonly atendimentoGateway: AtendimentoGateway,
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
    console.log(session);
    if (!session.estudante || !session.estudante.escolhaSetor) {
      console.log('msgNormalizada', msgNormalizada);
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
          await this.mensagensService.enviarMensagem(
            session,
            'Por favor, digite uma opção válida do menu.',
          );
      }
      return;
    } else if (session.estado === SessionState.AGUARDANDO_DADOS_ATENDIMENTO) {
      // Verifica se o usuário pediu para voltar ao menu principal
      if (msgNormalizada === '0') {
        await this.operacoesBaseService.voltarMenuPrincipal(session);
        return;
      }

      // Verifica se a mensagem contém dados de usuário formatados
      console.log('msgNormalizada', msgNormalizada);
      const dadosUsuario = await this.extrairDadosUsuario(mensagem);
      console.log('dadosUsuario', dadosUsuario);
      // Se encontrou dados do usuário, atualiza primeiro
      if (dadosUsuario) {
        const dadosCompletos = {
          ...dadosUsuario,
          escolhaSetor: session.estudante?.escolhaSetor || '',
        };

        await this.userDataService.updateUserData(
          session.userId,
          dadosCompletos,
          session,
        );
      } // Cria um atendimento usando o gateway de atendimento
      const numeroProtocolo =
        await this.atendimentoGateway.criarAtendimentoFromWhatsApp(session);

      // Confirma o registro e informa o protocolo
      await this.mensagensService.enviarMensagem(
        session,
        SuccessMessages.PROTOCOLO_GERADO(
          session.estudante?.escolhaSetor || '',
          numeroProtocolo,
        ),
      );

      // Atualiza o estado da sessão para atendimento humano
      session.estado = SessionState.ATENDIMENTO_HUMANO;
      await this.sessionService.updateSessionState(
        session.userId,
        SessionState.ATENDIMENTO_HUMANO,
      );

      // Informa que o usuário está aguardando atendimento
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
      console.log('msgNormalizada', msgNormalizada);
      // Verifica se a mensagem contém dados de usuário formatados
      const dadosUsuario = await this.extrairDadosUsuario(mensagem);
      console.log('dadosUsuario', dadosUsuario);
      // Se encontrou dados do usuário, atualiza primeiro
      if (dadosUsuario) {
        const { telefone, ...dadosSemTelefone } = dadosUsuario;
        const dadosCompletos = {
          ...dadosSemTelefone,
          escolhaSetor: session.estudante?.escolhaSetor || '',
        };

        await this.userDataService.updateUserData(
          session.userId,
          dadosCompletos,
          session,
        );
      } // Cria um atendimento usando o gateway de atendimento
      const numeroProtocolo =
        await this.atendimentoGateway.criarAtendimentoFromWhatsApp(session);

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
  /**
   * Extrai os dados do usuário a partir da mensagem formatada
   */
  private async extrairDadosUsuario(
    mensagem: string,
  ): Promise<Partial<Estudante> | null> {
    try {
      const yamlString = await getYamlFromAI(mensagem);
      if (!yamlString) return null;
      const dados = yaml.load(yamlString) as any;
      if (!dados) return null;
      const nome = dados.nome?.trim() || null;
      const telefone = dados.telefone?.trim() || null;
      const email = dados.email?.trim() || null;
      const curso = dados.curso?.trim() || 'Não informado';
      if (!nome || !telefone || !email) return null;
      return { nome, telefone, email, curso };
    } catch (error) {
      return null;
    }
  }
}

const MODEL = 'gemini-2.0-flash';
const API_KEY = process.env.GOOGLE_API_KEY || '';

async function getYamlFromAI(userInput: string): Promise<string | undefined> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const prompt = `
Extraia os dados do usuário abaixo e retorne apenas em YAML no formato:

nome:
telefone:
email:
curso:

caso não tenha algum dado, deixe em branco. e não coloque nenhum outro texto ou formatação.
caso você perceba alguma informação que não seja nome, telefone, email ou curso, ignore.
no telefone, coloque apenas os números, sem parênteses ou traços.
Texto do usuário:
${userInput}
`.trim();

  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text;
  } catch (error) {
    return undefined;
  }
}
