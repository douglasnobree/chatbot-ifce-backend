import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

async function testConnection() {
  console.log('Testando conexão com o banco de dados...');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL || 'não definida'}`);

  const prisma = new PrismaClient();

  try {
    // Tenta conectar ao banco de dados
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

    // Tenta fazer uma consulta simples
    const result = await prisma.$queryRaw`SELECT 1 as teste`;
    console.log('✅ Consulta de teste realizada com sucesso:', result);

    // Verifica se as tabelas foram criadas
    const tabelas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tabelas existentes no banco de dados:');
    console.table(tabelas);
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('Conexão fechada');
  }
}

testConnection()
  .then(() => console.log('Teste concluído'))
  .catch((error) => console.error('Erro no teste:', error));
