import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

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

  app.enableCors();
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
}
bootstrap();
