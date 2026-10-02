import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export const USUARIOS = {
  admin: 'admin@metahospitalar.com.br',
  gestor: 'gestor@metahospitalar.com.br',
  representante: 'representante@metahospitalar.com.br',
  visualizador: 'visualizador@metahospitalar.com.br',
} as const;

/**
 * Recria o banco de TESTE e semeia um usuário de cada papel com senha aleatória
 * (repassada aos testes por E2E_SENHA). O gestor começa com troca de senha obrigatória.
 */
export default function globalSetup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error('E2E exige DATABASE_URL_TEST apontando para um banco *_test.');
  }
  const senha = `E2e${randomBytes(9).toString('base64url')}7`;
  process.env.E2E_SENHA = senha;

  const api = path.resolve(import.meta.dirname, '../../api');
  const env = {
    ...process.env,
    DATABASE_URL: url,
    NODE_ENV: 'test',
    SEED_SENHA_INICIAL: senha,
    SEED_TROCAR_SENHA: USUARIOS.gestor,
  };
  // Sem `migrate reset`: aplica migrations e esvazia as tabelas (script recusa bancos que não sejam *_test).
  execSync('pnpm exec prisma migrate deploy', { cwd: api, env, stdio: 'pipe' });
  execSync('pnpm exec tsx test/limpar-banco-teste.ts', { cwd: api, env, stdio: 'pipe' });
  execSync('pnpm exec tsx prisma/seed.ts', { cwd: api, env, stdio: 'pipe' });
}
