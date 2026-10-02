import 'reflect-metadata';
import { criarApp } from './app.factory.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await criarApp();
await app.listen({ port: env.API_PORT, host: env.API_HOST });
