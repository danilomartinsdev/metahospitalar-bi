import fs from 'node:fs';
import path from 'node:path';

/**
 * Aponta a API para o banco de TESTE. Recusa rodar se a URL não for de um banco *_test,
 * para nunca apagar dados do banco de desenvolvimento ou produção.
 */
export function prepararEnvDeTeste(): void {
  const envFile = path.resolve(import.meta.dirname, '../../../.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('Defina DATABASE_URL_TEST (pnpm setup:env gera o .env com ela).');
  const nomeBanco = new URL(url).pathname.slice(1);
  if (!nomeBanco.endsWith('_test'))
    throw new Error(`DATABASE_URL_TEST precisa apontar para um banco *_test (atual: ${nomeBanco}).`);

  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = 'test';
  process.env.LOGIN_MAX_ATTEMPTS = '5';
  process.env.LOGIN_LOCK_MINUTES = '15';
  process.env.SESSION_IDLE_TIMEOUT_MIN = '30';
}
