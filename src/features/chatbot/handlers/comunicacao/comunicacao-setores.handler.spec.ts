import { ComunicacaoSetoresHandler } from './comunicacao-setores.handler';
import { MensagensService } from '../../services/mensagens.service';
import { OperacoesBaseService } from '../../services/operacoes-base.service';
import { SessionService } from '../../services/session.service';
import { UserDataService } from '../../services/user-data.service';
import { ProtocoloService } from '../../services/protocolo.service';
import { AtendimentoGateway } from './atendimento.gateway';
import { SessionState } from '../../entities/session.entity';
import { Estudante, Sessao } from '@prisma/client';
import * as yaml from 'js-yaml';

jest.mock('axios');

const makeHandler = () => {
  // Mocks para os serviços injetados
  const mensagensService = { enviarMensagem: jest.fn() };
  const operacoesBaseService = { voltarMenuPrincipal: jest.fn() };
  const sessionService = { updateSessionState: jest.fn() };
  const userDataService = { updateUserData: jest.fn() };
  const protocoloService = {};
  const atendimentoGateway = {};
  return new ComunicacaoSetoresHandler(
    mensagensService as any,
    operacoesBaseService as any,
    sessionService as any,
    userDataService as any,
    protocoloService as any,
    atendimentoGateway as any,
  );
};

describe('ComunicacaoSetoresHandler - extrairDadosUsuario', () => {
  it('deve extrair corretamente os dados do usuário de uma mensagem', async () => {
    const handler = makeHandler();
    // Simula resposta do getYamlFromAI
    const mensagem =
      'Meu nome é João, meu telefone é (85) 99999-8888, email joao@email.com, curso Sistemas.';
    const yamlString = `nome: João\ntelefone: 85999998888\nemail: joao@email.com\ncurso: Sistemas`;
    // Mock da função getYamlFromAI
    (handler as any).constructor.prototype.getYamlFromAI = jest
      .fn()
      .mockResolvedValue(yamlString);
    // Força o método a usar o mock
    const result = await (handler as any).extrairDadosUsuario(mensagem);
    expect(result).toEqual({
      nome: 'João',
      telefone: '85999998888',
      email: 'joao@email.com',
      curso: 'Sistemas',
    });
  });

  it('deve retornar null se faltar algum campo obrigatório', async () => {
    const handler = makeHandler();
    const mensagem = 'Meu nome é João, curso Sistemas.';
    const yamlString = `nome: João\ntelefone:\nemail:\ncurso: Sistemas`;
    (handler as any).constructor.prototype.getYamlFromAI = jest
      .fn()
      .mockResolvedValue(yamlString);
    const result = await (handler as any).extrairDadosUsuario(mensagem);
    expect(result).toBeNull();
  });

  it('deve retornar null se o YAML não for válido', async () => {
    const handler = makeHandler();
    const mensagem = 'Mensagem inválida';
    (handler as any).constructor.prototype.getYamlFromAI = jest
      .fn()
      .mockResolvedValue(undefined);
    const result = await (handler as any).extrairDadosUsuario(mensagem);
    expect(result).toBeNull();
  });
});
