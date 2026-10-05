import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

const AMOSTRA = path.resolve(import.meta.dirname, '../../../fixtures/focco/amostras/amostra-anonimizada.xls');
let ctx: Contexto;
let admin: string;

const req = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, token: string, payload?: object) =>
  ctx.app
    .inject({ method, url, headers: { authorization: `Bearer ${token}` }, ...(payload ? { payload } : {}) })
    .then((r) => ({
      status: r.statusCode,
      body: r.body ? (r.headers['content-type']?.includes('json') ? r.json() : r.body) : null,
    }));

async function importarAmostra(token: string) {
  const b = '----rbac';
  const payload = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="a.xls"\r\n\r\n`),
    fs.readFileSync(AMOSTRA),
    Buffer.from(`\r\n--${b}--\r\n`),
  ]);
  const h = { authorization: `Bearer ${token}` };
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
}

const papel = async (chave: string) => (await ctx.prisma.role.findUniqueOrThrow({ where: { chave } })).id;

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
});

describe('gestão de usuários', () => {
  it('admin cria usuário com senha provisória; o novo usuário precisa trocá-la', async () => {
    const r = await req('POST', '/api/usuarios', admin, {
      nome: 'Nova Pessoa',
      email: 'Nova@Meta.com',
      roleId: await papel('visualizador'),
      escopoTipo: 'todos',
    });
    expect(r.status).toBe(201);
    expect(r.body.usuario).toMatchObject({ email: 'nova@meta.com', trocarSenha: true, escopoTipo: 'todos' });
    expect(r.body.senhaProvisoria).toMatch(/^Meta.{10,}\d$/);

    const l = await login(ctx.app, 'nova@meta.com', r.body.senhaProvisoria);
    expect(l.res.statusCode).toBe(200);
    expect(l.body.usuario.trocarSenha).toBe(true);

    const log = await ctx.prisma.auditLog.findFirst({ where: { acao: 'usuario.criado' } });
    expect(JSON.stringify(log?.detalhes)).not.toContain(r.body.senhaProvisoria);
  });

  it('recusa e-mail duplicado e escopo incoerente', async () => {
    const base = { nome: 'X Y', roleId: await papel('visualizador') };
    expect(
      (await req('POST', '/api/usuarios', admin, { ...base, email: 'admin@meta.com', escopoTipo: 'todos' }))
        .status,
    ).toBe(409);
    expect(
      (
        await req('POST', '/api/usuarios', admin, {
          ...base,
          email: 'a@b.com',
          escopoTipo: 'representantes',
          representanteIds: [],
        })
      ).status,
    ).toBe(400);
    expect(
      (await req('POST', '/api/usuarios', admin, { ...base, email: 'a@b.com', escopoTipo: 'regiao' })).status,
    ).toBe(400);
  });

  it('gestor comercial (sem users.manage) não lista nem cria usuários', async () => {
    await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'gestor-comercial' });
    const g = (await login(ctx.app, 'gestor@meta.com')).body.accessToken;
    expect((await req('GET', '/api/usuarios', g)).status).toBe(403);
    expect((await req('GET', '/api/papeis', g)).status).toBe(403);
    expect((await req('GET', '/api/auditoria', g)).status).toBe(403);
    expect(
      (
        await req('POST', '/api/usuarios', g, {
          nome: 'X Y',
          email: 'x@y.com',
          roleId: await papel('admin'),
          escopoTipo: 'todos',
        })
      ).status,
    ).toBe(403);
  });

  it('admin não pode trocar o próprio papel', async () => {
    const eu = await ctx.prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@meta.com' } });
    const r = await req('PATCH', `/api/usuarios/${eu.id}`, admin, {
      nome: 'Eu',
      roleId: await papel('visualizador'),
      escopoTipo: 'todos',
    });
    expect(r.status).toBe(409);
  });

  it('redefinir senha gera provisória, exige troca e derruba as sessões', async () => {
    const u = await criarUsuario(ctx.prisma, { email: 'vis@meta.com', papel: 'visualizador' });
    const sessao = (await login(ctx.app, 'vis@meta.com')).body.accessToken;
    const r = await req('POST', `/api/usuarios/${u.id}/redefinir-senha`, admin);
    expect(r.status).toBe(200);
    expect((await req('GET', '/api/auth/me', sessao)).status).toBe(401);
    expect((await login(ctx.app, 'vis@meta.com', r.body.senhaProvisoria)).body.usuario.trocarSenha).toBe(
      true,
    );
  });
});

describe('papéis editáveis', () => {
  it('remover uma permissão vale na hora para quem já está logado', async () => {
    await criarUsuario(ctx.prisma, { email: 'vis@meta.com', papel: 'visualizador' });
    const vis = (await login(ctx.app, 'vis@meta.com')).body.accessToken;
    expect((await req('GET', '/api/dashboard/meses', vis)).status).toBe(200);

    const id = await papel('visualizador');
    const r = await req('PATCH', `/api/papeis/${id}`, admin, {
      nome: 'Visualizador',
      permissoes: ['pedidos.view'],
    });
    expect(r.status).toBe(200);
    expect(r.body.permissoes).toEqual(['pedidos.view']);
    expect((await req('GET', '/api/dashboard/meses', vis)).status).toBe(403);

    const log = await ctx.prisma.auditLog.findFirst({ where: { acao: 'papel.alterado' } });
    expect(log?.detalhes).toMatchObject({ depois: ['pedidos.view'] });
  });

  it('papel Admin mantém todas as permissões; papéis padrão não são removidos', async () => {
    const id = await papel('admin');
    expect(
      (await req('PATCH', `/api/papeis/${id}`, admin, { nome: 'Admin', permissoes: ['dashboard.view'] }))
        .status,
    ).toBe(409);
    expect((await req('DELETE', `/api/papeis/${id}`, admin)).status).toBe(409);
  });

  it('cria, usa e remove papel personalizado; não remove se houver usuários', async () => {
    const novo = await req('POST', '/api/papeis', admin, {
      nome: 'Diretoria',
      permissoes: ['dashboard.view', 'export.pdf'],
    });
    expect(novo.status).toBe(201);
    const u = await criarUsuario(ctx.prisma, { email: 'dir@meta.com' });
    await ctx.prisma.usuario.update({ where: { id: u.id }, data: { roleId: novo.body.id } });
    expect((await req('DELETE', `/api/papeis/${novo.body.id}`, admin)).status).toBe(409);
    await ctx.prisma.usuario.delete({ where: { id: u.id } });
    expect((await req('DELETE', `/api/papeis/${novo.body.id}`, admin)).status).toBe(204);
  });

  it('rejeita permissão desconhecida', async () => {
    const r = await req('POST', '/api/papeis', admin, { nome: 'Hacker', permissoes: ['tudo.liberado'] });
    expect(r.status).toBe(400);
  });
});

describe('escopo por região e mudança de escopo', () => {
  it('usuário com escopo de região só vê pedidos das regiões escolhidas', async () => {
    await importarAmostra(admin);
    const criado = await req('POST', '/api/usuarios', admin, {
      nome: 'Regional Sudeste',
      email: 'sudeste@meta.com',
      roleId: await papel('visualizador'),
      escopoTipo: 'regiao',
      escopoRegioes: ['SUDESTE'],
    });
    await ctx.prisma.usuario.update({ where: { id: criado.body.usuario.id }, data: { trocarSenha: false } });
    const t = (await login(ctx.app, 'sudeste@meta.com', criado.body.senhaProvisoria)).body.accessToken;

    const regioes = await req('GET', '/api/dashboard/ranking/regioes?de=2026-01&ate=2026-12', t);
    expect(regioes.body.linhas.map((l: { chave: string }) => l.chave)).toEqual(['SUDESTE']);
    const todos = await req('GET', '/api/dashboard/ranking/regioes?de=2026-01&ate=2026-12', admin);
    const sudeste = todos.body.linhas.find((l: { chave: string }) => l.chave === 'SUDESTE');
    expect(regioes.body.total.total).toBe(sudeste.total);

    const pedidos = await req('GET', '/api/pedidos?de=2026-01&ate=2026-12&pageSize=200', t);
    expect(new Set(pedidos.body.data.map((p: { regiao: string }) => p.regiao))).toEqual(new Set(['Sudeste']));

    // Mudança de escopo pelo admin vale na próxima requisição.
    await req('PATCH', `/api/usuarios/${criado.body.usuario.id}`, admin, {
      nome: 'Regional Sul',
      roleId: await papel('visualizador'),
      escopoTipo: 'regiao',
      escopoRegioes: ['SUL'],
    });
    const depois = await req('GET', '/api/dashboard/ranking/regioes?de=2026-01&ate=2026-12', t);
    expect(depois.body.linhas.map((l: { chave: string }) => l.chave)).toEqual(['SUL']);
  });
});

describe('correções da revisão de RBAC', () => {
  async function gerenteDeUsuarios() {
    // Papel personalizado com users.manage, mas que não é Admin.
    const papelRh = await ctx.prisma.role.create({
      data: {
        chave: 'rh',
        nome: 'RH',
        permissoes: { create: [{ permissao: 'users.manage' }, { permissao: 'dashboard.view' }] },
      },
    });
    const u = await criarUsuario(ctx.prisma, { email: 'rh@meta.com' });
    await ctx.prisma.usuario.update({ where: { id: u.id }, data: { roleId: papelRh.id } });
    return { token: (await login(ctx.app, 'rh@meta.com')).body.accessToken as string, papelRh, u };
  }

  it('escopo por região não recebe metas de representantes via filtro de gestor', async () => {
    await importarAmostra(admin);
    const rep = await ctx.prisma.representante.findFirstOrThrow();
    await ctx.prisma.meta.create({
      data: { ano: 2026, mes: 1, representanteId: rep.id, valor: '123456.00' },
    });
    const u = await criarUsuario(ctx.prisma, { email: 'reg@meta.com', papel: 'visualizador' });
    await ctx.prisma.usuario.update({
      where: { id: u.id },
      data: { escopoTipo: 'REGIAO', escopoRegioes: ['SUL'] },
    });
    const t = (await login(ctx.app, 'reg@meta.com')).body.accessToken;
    const v = await req('GET', `/api/dashboard/visao-geral?de=2026-01&ate=2026-12&gestor=${rep.id}`, t);
    expect(v.body.evolucao.meses.every((m: { meta: string | null }) => m.meta === null)).toBe(true);
  });

  it('quem tem users.manage sem ser Admin não promove ninguém a Admin nem altera Admins', async () => {
    const { token } = await gerenteDeUsuarios();
    const adminRole = await papel('admin');
    const novo = await req('POST', '/api/usuarios', token, {
      nome: 'Infiltrado',
      email: 'x@meta.com',
      roleId: adminRole,
      escopoTipo: 'todos',
    });
    expect(novo.status).toBe(403);
    const adm = await ctx.prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@meta.com' } });
    expect((await req('POST', `/api/usuarios/${adm.id}/desativar`, token)).status).toBe(403);
    expect((await req('POST', `/api/usuarios/${adm.id}/redefinir-senha`, token)).status).toBe(403);
  });

  it('ninguém edita o próprio papel nem concede permissões administrativas sem ser Admin', async () => {
    const { token, papelRh, u } = await gerenteDeUsuarios();
    const proprio = await req('PATCH', `/api/papeis/${papelRh.id}`, token, {
      nome: 'RH',
      permissoes: ['users.manage', 'audit.view', 'import.run'],
    });
    expect(proprio.status).toBe(409);
    const outro = await req('PATCH', `/api/papeis/${await papel('visualizador')}`, token, {
      nome: 'Visualizador',
      permissoes: ['dashboard.view', 'audit.view'],
    });
    expect(outro.status).toBe(403);
    expect(
      (await req('POST', '/api/papeis', token, { nome: 'Super', permissoes: ['users.manage'] })).status,
    ).toBe(403);
    // Nem trocar o próprio escopo.
    const esc = await req('PATCH', `/api/usuarios/${u.id}`, token, {
      nome: 'RH',
      roleId: papelRh.id,
      escopoTipo: 'regiao',
      escopoRegioes: ['SUL'],
    });
    expect(esc.status).toBe(409);
  });

  it('metas e importação exigem escopo "todos"; representante inexistente na meta é 400', async () => {
    const g = await criarUsuario(ctx.prisma, { email: 'gr@meta.com', papel: 'gestor-comercial' });
    await ctx.prisma.usuario.update({
      where: { id: g.id },
      data: { escopoTipo: 'REGIAO', escopoRegioes: ['SUL'] },
    });
    const t = (await login(ctx.app, 'gr@meta.com')).body.accessToken;
    expect((await req('GET', '/api/metas?ano=2026', t)).status).toBe(403);
    expect((await req('GET', '/api/import/lotes', t)).status).toBe(403);
    const r = await req('PUT', '/api/metas', admin, {
      ano: 2026,
      metas: [{ mes: 1, representanteId: '00000000-0000-4000-8000-000000000000', valor: '10' }],
    });
    expect(r.status).toBe(400);
  });

  it('não confirma prévia enviada por outro usuário', async () => {
    const b = '----outro';
    const payload = Buffer.concat([
      Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="a.xls"\r\n\r\n`),
      fs.readFileSync(AMOSTRA),
      Buffer.from(`\r\n--${b}--\r\n`),
    ]);
    const p = (
      await ctx.app.inject({
        method: 'POST',
        url: '/api/import/previa',
        payload,
        headers: { authorization: `Bearer ${admin}`, 'content-type': `multipart/form-data; boundary=${b}` },
      })
    ).json();
    await criarUsuario(ctx.prisma, { email: 'g2@meta.com', papel: 'gestor-comercial' });
    const g2 = (await login(ctx.app, 'g2@meta.com')).body.accessToken;
    expect((await req('POST', '/api/import/confirmar', g2, { hash: p.hash })).status).toBe(404);
  });
});

describe('auditoria', () => {
  it('lista com filtros e paginação, sem expor dados sensíveis', async () => {
    await login(ctx.app, 'admin@meta.com', 'senha-errada-123');
    const r = await req('GET', '/api/auditoria?acao=login&pageSize=10', admin);
    expect(r.status).toBe(200);
    expect(r.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(r.body.data.every((l: { acao: string }) => l.acao.startsWith('login'))).toBe(true);
    expect(JSON.stringify(r.body)).not.toMatch(/senhaHash|senha-errada|tokenHash/);
    const acoes = await req('GET', '/api/auditoria/acoes', admin);
    expect(acoes.body).toEqual(expect.arrayContaining(['login.sucesso', 'login.falha']));
  });
});
