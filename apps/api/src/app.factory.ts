import { randomUUID } from 'node:crypto';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { type Env, loadEnv } from './config/env.js';

/** Header usado pelos testes para exercitar o rate limit (desligado no resto da suíte). */
export const HEADER_TESTAR_RATE_LIMIT = 'x-testar-rate-limit';

export function criarAdapter(env: Env): FastifyAdapter {
  return new FastifyAdapter({
    trustProxy: env.NODE_ENV === 'production',
    bodyLimit: 1_048_576,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });
}

/** Plugins e configurações comuns ao main.ts e aos testes de integração. */
export async function configurarApp(app: NestFastifyApplication, env: Env): Promise<NestFastifyApplication> {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // Devolve o id da requisição (o mesmo dos logs) para facilitar suporte.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (req, reply) => {
      void reply.header('x-request-id', req.id);
    });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  });
  await app.register(fastifyCookie);
  await app.register(fastifyRateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    allowList: (req) => env.NODE_ENV === 'test' && !req.headers[HEADER_TESTAR_RATE_LIMIT],
  });
  app.enableCors({ origin: [env.WEB_ORIGIN], credentials: true });
  app.enableShutdownHooks();
  return app;
}

export async function criarApp(): Promise<NestFastifyApplication> {
  const env = loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, criarAdapter(env), {
    bufferLogs: true,
  });
  return configurarApp(app, env);
}
