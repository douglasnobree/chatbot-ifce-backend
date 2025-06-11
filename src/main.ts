import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Desativa o bodyParser para aplicar nossa própria configuração
  });
  const configService = app.get(ConfigService);

  // Aumenta o limite para 50MB
  app.use(json({ limit: '50mb' }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Chatbot IFCE API')
    .setDescription('Documentação automática das rotas da API')
    .setVersion('1.0')
    .addTag('whatsapp')
    .addTag('auth')
    .addTag('atendentes')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Obtenha a porta do .env ou use 3000 como padrão
  const port = configService.get<number>('PORT', 3000);
  // Configuração completa do CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://seu-dominio-em-producao.com'], // Origens permitidas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });

  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port);

  const separator = '═';
  logger.log(separator.repeat(50));
  logger.log(`\x1b[32m✅ SERVIDOR INICIADO COM SUCESSO!\x1b[0m`);
  logger.log(
    `\x1b[36m🚀 API rodando em: \x1b[33mhttp://localhost:${port}\x1b[0m`,
  );
  logger.log(
    `\x1b[36m📚 Swagger disponível em: \x1b[33mhttp://localhost:${port}/api\x1b[0m`,
  );
  logger.log(
    `\x1b[36m🎧 Painel do Atendente: \x1b[33mhttp://localhost:${port}/painel-atendente.html\x1b[0m`,
  );
  logger.log(separator.repeat(50));

  // Garantir que o diretório de uploads exista
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const mediaDir = path.join(uploadsDir, 'media');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  // Configurar acesso a arquivos estáticos
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
}
bootstrap();
