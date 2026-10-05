import { filtrosSchema } from '@meta-bi/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco } from './helpers.js';

const { PrintTokenService } = await import('../src/modules/export/print-token.service.js');
const { UsuarioLoader } = await import('../src/modules/auth/usuario-loader.service.js');

let ctx: Contexto;
let usuarioId: string;
let tokens: InstanceType<typeof PrintTokenService>;

const relatorio = (token: string) =>
  ctx.app.inject({ method: 'GET', url: `/api/print/relatorio?token=${encodeURIComponent(token)}` });

async function novoToken(agora?: Date) {
  const u = await ctx.app.get(UsuarioLoader).carregarAtivo(usuarioId);
  return tokens.criar(u!, filtrosSchema.parse({ de: '2026-01', ate: '2026-03' }), agora);
}

beforeAll(async () => {
  ctx = await iniciarApp();
  await limparBanco(ctx.prisma);
  usuarioId = (await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'gestor-comercial' })).id;
  tokens = ctx.app.get(PrintTokenService);
});

afterAll(async () => {
  await ctx.app.close();
});

describe('token de impressão do PDF (banco, uso único)', () => {
  it('o token vale uma vez e traz o usuário e os filtros de quem pediu', async () => {
    const token = await novoToken();
    const r = await relatorio(token);
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({
      geradoPor: expect.any(String),
      filtros: { de: '2026-01', ate: '2026-03' },
    });
    // Só o hash fica no banco.
    expect(await ctx.prisma.tokenImpressao.count({ where: { tokenHash: token } })).toBe(0);
    expect((await relatorio(token)).statusCode).toBe(401);
  });

  it('token expirado é recusado', async () => {
    const token = await novoToken(new Date(Date.now() - 2 * 60_000));
    expect((await relatorio(token)).statusCode).toBe(401);
  });

  it('usuário desativado depois de pedir o PDF não consegue ler os dados', async () => {
    const token = await novoToken();
    await ctx.prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: false } });
    expect((await relatorio(token)).statusCode).toBe(401);
    await ctx.prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: true } });
  });

  it('token inventado é recusado', async () => {
    expect((await relatorio('a'.repeat(43))).statusCode).toBe(401);
  });
});
