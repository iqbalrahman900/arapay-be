import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Setup global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  // Setup global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Micro Lending API')
    .setDescription('API documentation for Micro Lending Company\'s Accounts Receivable Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
  
}
bootstrap();