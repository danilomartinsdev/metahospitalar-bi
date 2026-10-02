import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

/** Cria a aplicação configurada (usada pelo main.ts e pelos testes de integração). */
export async function criarApp(): Promise<NestFastifyApplication> {
  const env = loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: env.NODE_ENV === 'production', bodyLimit: 1_048_576 }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  });
  await app.register(fastifyCookie);
  await app.register(fastifyRateLimit, {
    global: true,
    max: env.NODE_ENV === 'test' ? 10_000 : 300,
    timeWindow: '1 minute',
  });
  app.enableCors({ origin: [env.WEB_ORIGIN], credentials: true });
  app.enableShutdownHooks();
  return app;
}
