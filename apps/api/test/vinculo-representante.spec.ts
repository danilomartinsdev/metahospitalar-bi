import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

// Ligação usuário ↔ código do Focco feita em Cadastro de representantes (PUT /usuarios/vinculos/:id).
// É ela que restringe o representante às próprias vendas; o cadastro de usuário não oferece mais isso.

const AMOSTRA = path.resolve(import.meta.dirname, '../../../fixtures/focco/amostras/amostra-anonimizada.xls');
const PERIODO = 'de=2026-01&ate=2026-12';
let ctx: Contexto;
let admin: string;
let repId: string;
let outroRepId: string;

const req = (method: 'GET' | 'POST' | 'PUT', url: string, token: string, payload?: object) =>
  ctx.app
    .inject({ method, url, headers: { authorization: `Bearer ${token}` }, ...(payload ? { payload } : {}) })
    .then((r) => ({ status: r.statusCode, body: r.body ? r.json() : null }));

const vincular = (representanteId: string, usuarioId: string | null, token = admin) =>
  req('PUT', `/api/usuarios/vinculos/${representanteId}`, token, { usuarioId });

/** Representante criado como na tela: papel Representante, sem código ligado ainda. */
async function novoRepresentante(email: string) {
  const roleId = (await ctx.prisma.role.findUniqueOrThrow({ where: { chave: 'representante' } })).id;
  const r = await req('POST', '/api/usuarios', admin, {
    nome: 'Rep Teste',
    email,
    roleId,
    escopoTipo: 'representantes',
    representanteIds: [],
  });
  expect(r.status).toBe(201);
  await ctx.prisma.usuario.update({ where: { id: r.body.usuario.id }, data: { trocarSenha: false } });
  const token = (await login(ctx.app, email, r.body.senhaProvisoria)).body.accessToken as string;
  return { id: r.body.usuario.id as string, token };
}

const codigosVistos = async (token: string) =>
  (await req('GET', `/api/dashboard/ranking/gestores?${PERIODO}`, token)).body.linhas.map(
    (l: { chave: string }) => l.chave,
  );

beforeAll(async () => {
  ctx = await iniciarApp();
});
afterAll(async () => {
  await ctx.app.close();
});
beforeEach(async () => {
  await limparBanco(ctx.prisma);
  await criarUsuario(ctx.prisma, { email: 'admin@meta.com' });
  admin = (await login(ctx.app, 'admin@meta.com')).body.accessToken;
  const b = '----vinc';
  const payload = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="a.xls"\r\n\r\n`),
    fs.readFileSync(AMOSTRA),
    Buffer.from(`\r\n--${b}--\r\n`),
  ]);
  const h = { authorization: `Bearer ${admin}` };
  const p = (
    await ctx.app.inject({
      method: 'POST',
      url: '/api/import/previa',
      payload,
      headers: { ...h, 'content-type': `multipart/form-data; boundary=${b}` },
    })
  ).json();
  await ctx.app.inject({
    method: 'POST',
    url: '/api/import/confirmar',
    headers: h,
    payload: { hash: p.hash, arquivoNome: 'a.xls' },
  });
  const reps = await ctx.prisma.representante.findMany({ orderBy: { codigo: 'asc' } });
  repId = reps[0]!.id;
  outroRepId = reps[1]!.id;
});

describe('ligação do representante ao usuário (Cadastro de representantes)', () => {
  it('sem código ligado o representante não vê nenhum pedido; ligado, vê só o seu código', async () => {
    const rep = await novoRepresentante('rep@meta.com');
    expect(await codigosVistos(rep.token)).toEqual([]);

    expect((await vincular(repId, rep.id)).status).toBe(204);
    expect(await codigosVistos(rep.token)).toEqual([repId]);
    const pedidos = await req('GET', `/api/pedidos?${PERIODO}&gestor=${outroRepId}`, rep.token);
    expect(pedidos.body.meta.total).toBe(0);
  });

  it('ligar o código a outro usuário tira do anterior; desligar deixa sem pedidos (nunca a empresa toda)', async () => {
    const a = await novoRepresentante('a@meta.com');
    const b = await novoRepresentante('b@meta.com');
    await vincular(repId, a.id);
    await vincular(repId, b.id);
    expect(await codigosVistos(a.token)).toEqual([]);
    expect(await codigosVistos(b.token)).toEqual([repId]);

    expect((await vincular(repId, null)).status).toBe(204);
    expect(await codigosVistos(b.token)).toEqual([]);
    const usuario = await ctx.prisma.usuario.findUniqueOrThrow({ where: { id: b.id } });
    expect(usuario.escopoTipo).toBe('REPRESENTANTES');
  });

  it('usuário com escopo "todos" passa a ver só o código ligado; um usuário pode ter vários códigos', async () => {
    const u = await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'visualizador' });
    const token = (await login(ctx.app, 'gestor@meta.com')).body.accessToken;
    expect((await codigosVistos(token)).length).toBeGreaterThan(2);
    await vincular(repId, u.id);
    await vincular(outroRepId, u.id);
    expect((await codigosVistos(token)).sort()).toEqual([repId, outroRepId].sort());
  });

  it('registra na auditoria', async () => {
    const rep = await novoRepresentante('rep@meta.com');
    await vincular(repId, rep.id);
    const log = await ctx.prisma.auditLog.findFirstOrThrow({ where: { acao: 'representante.vinculo' } });
    expect(log.entidadeId).toBe(repId);
    expect(log.detalhes).toMatchObject({ antes: [], depois: [rep.id] });
  });

  it('protege contra abuso: próprio usuário, sem users.manage, Admin, inexistentes e corpo inválido', async () => {
    const adm = await ctx.prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@meta.com' } });
    expect((await vincular(repId, adm.id)).status).toBe(409);

    const rep = await novoRepresentante('rep@meta.com');
    expect((await vincular(repId, rep.id, rep.token)).status).toBe(403);

    // users.manage sem ser Admin não mexe no escopo de um Admin.
    const papelRh = await ctx.prisma.role.create({
      data: { chave: 'rh', nome: 'RH', permissoes: { create: [{ permissao: 'users.manage' }] } },
    });
    const rh = await criarUsuario(ctx.prisma, { email: 'rh@meta.com' });
    await ctx.prisma.usuario.update({ where: { id: rh.id }, data: { roleId: papelRh.id } });
    const tokenRh = (await login(ctx.app, 'rh@meta.com')).body.accessToken;
    const outroAdmin = await criarUsuario(ctx.prisma, { email: 'admin2@meta.com' });
    expect((await vincular(repId, outroAdmin.id, tokenRh)).status).toBe(403);
    expect((await vincular(repId, rep.id, tokenRh)).status).toBe(204);

    expect((await vincular('00000000-0000-4000-8000-000000000000', rep.id)).status).toBe(404);
    expect((await vincular(repId, '00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await req('PUT', `/api/usuarios/vinculos/${repId}`, admin, { usuarioId: 'x' })).status).toBe(400);
  });
});
