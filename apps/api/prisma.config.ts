import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 não carrega .env sozinho: usamos o .env da raiz do monorepo, se existir.
const envFile = path.resolve(import.meta.dirname, '../../.env');
if (fs.existsSync(envFile) && !process.env.DATABASE_URL) process.loadEnvFile(envFile);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Migrations usam a conexão direta quando houver (Neon: a URL normal é a do pool de conexões).
  // DATABASE_URL_UNPOOLED é o nome que a integração Neon da Vercel cria (valor sensível, não copiável).
  datasource: {
    url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL_UNPOOLED || env('DATABASE_URL'),
  },
});
