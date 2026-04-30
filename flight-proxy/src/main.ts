// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT || 3000;

  // Configuración CORS más precisa
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Servir index.html y archivos estáticos desde la raíz del proyecto
  app.useStaticAssets(join(__dirname, '..', '..', '..'), {
    index: ['index.html'],
  });

  await app.listen(port);
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`📁 Sirviendo archivos estáticos desde: ${join(__dirname, '..', '..', '..')}`);
}
bootstrap();