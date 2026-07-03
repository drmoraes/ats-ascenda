import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { loadEnv } from './common/config/env';
import { DomainExceptionFilter } from './common/errors/domain-exception.filter';

async function bootstrap(): Promise<void> {
  const env = loadEnv(); // fail-fast se o ambiente estiver inválido

  // Body parser próprio, com limite explícito (uploads vão direto ao S3, então
  // os corpos JSON são pequenos — reduz superfície de abuso).
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(express.json({ limit: env.HTTP_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.HTTP_BODY_LIMIT }));

  // Cabeçalhos de segurança.
  app.use(helmet());

  // Rate limiting global (defesa contra abuso/força bruta).
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // CORS restrito por origem (sem '*' quando há credenciais).
  const origins = env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  app.enableCors({
    origin: origins && origins.length > 0 ? origins : false,
    credentials: true,
  });

  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks(); // encerra filas/conexões graciosamente

  await app.listen(env.PORT);
  new Logger('Bootstrap').log(`ATS ASCENDA API ouvindo na porta ${env.PORT}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Falha no bootstrap:', err);
  process.exit(1);
});
