import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Chatbot IFCE API')
    .setDescription('Documentação automática das rotas da API WhatsApp')
    .setVersion('1.0')
    .addTag('whatsapp')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Obtenha a porta do .env ou use 3000 como padrão
  const port = configService.get<number>('PORT', 3000);

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
  logger.log(separator.repeat(50));
}
bootstrap();
