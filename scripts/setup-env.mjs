#!/usr/bin/env node
// Gera o .env a partir do .env.example com segredos aleatórios.
// Nunca imprime os valores gerados. Não sobrescreve um .env existente.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('.env já existe — nada foi alterado. Apague-o manualmente se quiser regerar.');
  process.exit(0);
}

const secret = (bytes) => crypto.randomBytes(bytes).toString('base64url');
const generated = {
  POSTGRES_PASSWORD: secret(24),
  JWT_ACCESS_SECRET: secret(48),
};

let content = fs.readFileSync(examplePath, 'utf8');
for (const [key, value] of Object.entries(generated)) {
  content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
}
// DATABASE_URL / DATABASE_URL_TEST usam a senha gerada.
content = content.replaceAll('__POSTGRES_PASSWORD__', encodeURIComponent(generated.POSTGRES_PASSWORD));

fs.writeFileSync(envPath, content, { mode: 0o600 });
console.log(`.env criado com segredos aleatórios (${Object.keys(generated).join(', ')}).`);
console.log('Se o volume do Postgres já existia com outra senha, recrie-o: pnpm db:reset');
