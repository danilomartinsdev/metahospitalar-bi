// Função serverless da Vercel: toda requisição /api/* cai aqui e é repassada à mesma aplicação NestJS
// (Fastify) usada no Docker. A aplicação é criada uma vez por instância e reaproveitada entre requisições.
import 'reflect-metadata';
import { criarApp } from '../dist/app.factory.js';

let pronto;

async function iniciar() {
  const app = await criarApp();
  await app.init();
  const fastify = app.getHttpAdapter().getInstance();
  await fastify.ready();
  return fastify;
}

export default async function handler(req, res) {
  pronto ??= iniciar().catch((e) => {
    pronto = undefined;
    throw e;
  });
  const fastify = await pronto;
  fastify.server.emit('request', req, res);
}
