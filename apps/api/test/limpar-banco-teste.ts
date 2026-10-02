// Esvazia o banco de TESTE (usado pelo E2E). Recusa qualquer banco que não termine em _test.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const url = process.env.DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error('limpar-banco-teste: DATABASE_URL precisa apontar para um banco *_test.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
await prisma.$executeRawUnsafe(`
  TRUNCATE "AuditLog", "Sessao", "TokenRedefinicaoSenha", "TokenImpressao", "UsuarioRepresentante",
           "ImportLoteItem", "Pedido", "ImportLote", "Meta", "Usuario", "RolePermission", "Role",
           "Representante", "Cliente", "StatusPdv" RESTART IDENTITY CASCADE`);
await prisma.$disconnect();
