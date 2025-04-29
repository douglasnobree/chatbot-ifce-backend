import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
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
  console.log(`Aplicação rodando na porta ${port}`);
  console.log(
    `Documentação Swagger disponível em: http://localhost:${port}/api`,
  );
}
bootstrap();
