import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 4000;
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Database Office API')
    .setDescription('Dokumentation Database Office API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: (
        operationA: { get: (key: string) => string },
        operationB: { get: (key: string) => string },
      ) => {
        const methodOrder: Record<string, number> = {
          post: 1,
          get: 2,
          patch: 3,
          delete: 4,
        };

        const methodA = operationA.get('method').toLowerCase();
        const methodB = operationB.get('method').toLowerCase();

        return (methodOrder[methodA] ?? 99) - (methodOrder[methodB] ?? 99);
      },
    },
  });

  await app.listen(port);

  console.clear();
  console.log(
    '\x1b[36m%s\x1b[0m',
    '================================================',
  );
  console.log('\x1b[32m%s\x1b[0m', ' Database Office Backend is Running');
  console.log(
    '\x1b[36m%s\x1b[0m',
    '================================================',
  );
  console.log(` Server URL   : http://localhost:${port}`);
  console.log(` Swagger API  : http://localhost:${port}/api/docs`);
  console.log(` Environment  : ${process.env.NODE_ENV ?? 'development'}`);
  console.log(' Developed by : dony putra perkasa (owner)');
  console.log(
    '\x1b[36m%s\x1b[0m',
    '================================================',
  );
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
});
