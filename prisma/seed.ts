import { PrismaClient } from '@prisma/client';
import { SessionState } from '../src/features/chatbot/entities/session.entity';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpa dados existentes para evitar duplicação
  await prisma.mensagem.deleteMany({});
  await prisma.sessao.deleteMany({});
  await prisma.estudante.deleteMany({});
  await prisma.atendente.deleteMany({});

  // Cria atendentes de exemplo
  const atendente1 = await prisma.atendente.create({
    data: {
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@ifce.edu.br',
      cargo: 'Assistente Administrativo',
      departamento: 'Secretaria Acadêmica',
    },
  });

  const atendente2 = await prisma.atendente.create({
    data: {
      nome: 'João Santos',
      email: 'joao.santos@ifce.edu.br',
      cargo: 'Coordenador',
      departamento: 'Assistência Estudantil',
    },
  });

  console.log('Atendentes criados:', atendente1.nome, atendente2.nome);

  // Cria estudantes de exemplo
  const estudantes = await Promise.all([
    prisma.estudante.create({
      data: {
        nome: 'Ana Silva',
        cpf: '12345678910',
        telefone: '8599992345',
        email: 'ana.silva@estudante.ifce.edu.br',
        matricula: '2023123456',
        curso: 'Engenharia Civil',
      },
    }),
    prisma.estudante.create({
      data: {
        nome: 'Carlos Pereira',
        cpf: '98765432109',
        telefone: '8599993456',
        email: 'carlos.pereira@estudante.ifce.edu.br',
        matricula: '2023654321',
        curso: 'Análise e Desenvolvimento de Sistemas',
      },
    }),
    prisma.estudante.create({
      data: {
        nome: 'Mariana Costa',
        cpf: '45678912345',
        telefone: '8599994567',
        email: 'mariana.costa@estudante.ifce.edu.br',
        matricula: '2023789456',
        curso: 'Administração',
      },
    }),
  ]);

  console.log('Estudantes criados:', estudantes.map((e) => e.nome).join(', '));

  // Cria uma sessão de exemplo com algumas mensagens
  const sessao = await prisma.sessao.create({
    data: {
      userId: '558899992345@s.whatsapp.net',
      estado: SessionState.MAIN_MENU,
      instanceName: 'test-instance',
      esperando_resposta: false,
      estudante_id: estudantes[0].id,
    },
  });

  // Adiciona algumas mensagens de exemplo à sessão
  await prisma.mensagem.createMany({
    data: [
      {
        conteudo: 'Olá, preciso de ajuda com minha matrícula',
        origem: 'USUARIO',
        sessao_id: sessao.id,
        timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
      },
      {
        conteudo:
          'Bem-vindo ao atendimento virtual do IFCE. Como posso ajudar?',
        origem: 'BOT',
        sessao_id: sessao.id,
        timestamp: new Date(Date.now() - 3500000), // 58 minutos atrás
      },
      {
        conteudo: 'Quero consultar meu número de matrícula',
        origem: 'USUARIO',
        sessao_id: sessao.id,
        timestamp: new Date(Date.now() - 3400000), // 57 minutos atrás
      },
      {
        conteudo:
          'Por favor, informe seu CPF e os últimos 4 dígitos do seu telefone',
        origem: 'BOT',
        sessao_id: sessao.id,
        timestamp: new Date(Date.now() - 3300000), // 55 minutos atrás
      },
    ],
  });

  console.log('Sessão de exemplo criada com mensagens');
  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
