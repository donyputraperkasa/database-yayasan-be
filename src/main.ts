import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
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
    credentials: true,
    origin: allowedOrigins,
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Dokumen dan scan SK hanya boleh dibuka melalui endpoint yang memakai guard.
  app.use('/uploads/documents', (_request: Request, response: Response) => {
    response.sendStatus(404);
  });
  app.use(
    '/uploads/employees/decrees',
    (_request: Request, response: Response) => {
      response.sendStatus(404);
    },
  );
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), {
      dotfiles: 'deny',
      index: false,
      setHeaders: (response) =>
        response.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Database Office API')
    .setDescription('Dokumentation Database Office API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const isSwaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true';

  if (isSwaggerEnabled) {
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

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
  if (isSwaggerEnabled) {
    console.log(` Swagger API  : http://localhost:${port}/api/docs`);
  }
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
