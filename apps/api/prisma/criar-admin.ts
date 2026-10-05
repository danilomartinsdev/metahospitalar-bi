// Cria (ou reativa) um administrador com escopo "todos" — usado no primeiro deploy de produção,
// onde o seed não cria usuários. Dados por variável de ambiente (a senha nunca vai para o histórico do shell
// se for informada via arquivo/variável exportada):
//   ADMIN_EMAIL=voce@empresa.com ADMIN_NOME="Seu Nome" ADMIN_SENHA='...' pnpm exec tsx prisma/criar-admin.ts
// A troca de senha é obrigatória no primeiro acesso.
import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client.js';

const envFile = path.resolve(import.meta.dirname, '../../../.env');
if (fs.existsSync(envFile) && !process.env.DATABASE_URL) process.loadEnvFile(envFile);

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const nome = process.env.ADMIN_NOME?.trim();
const senha = process.env.ADMIN_SENHA;
if (!email || !nome || !senha) {
  console.error('Informe ADMIN_EMAIL, ADMIN_NOME e ADMIN_SENHA.');
  process.exit(1);
}
if (senha.length < 10) {
  console.error('ADMIN_SENHA precisa de pelo menos 10 caracteres.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
try {
  const role = await prisma.role.findUnique({ where: { chave: 'admin' } });
  if (!role) throw new Error('Papel "admin" não existe: rode o seed (prisma/seed.ts) antes.');
  const senhaHash = await argon2.hash(senha, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  const u = await prisma.usuario.upsert({
    where: { email },
    update: { senhaHash, ativo: true, trocarSenha: true, roleId: role.id, escopoTipo: 'TODOS' },
    create: { email, nome, roleId: role.id, senhaHash, trocarSenha: true, escopoTipo: 'TODOS' },
  });
  console.log(`Admin pronto: ${u.email} (troca de senha obrigatória no primeiro acesso).`);
} finally {
  await prisma.$disconnect();
}
