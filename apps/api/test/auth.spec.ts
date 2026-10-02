import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HEADER_TESTAR_RATE_LIMIT } from '../src/app.factory.js';
import {
  type Contexto,
  SENHA,
  cookieRefresh,
  criarUsuario,
  iniciarApp,
  limparBanco,
  login,
} from './helpers.js';

let ctx: Contexto;
const auth = (token: string) => ({ authorization: `Bearer ${token}` });
const cookie = (rt: string) => ({ cookie: `mb_rt=${rt}` });

beforeAll(async () => {
  ctx = await iniciarApp();
});
afterAll(async () => {
  await ctx.app.close();
});
beforeEach(async () => {
  await limparBanco(ctx.prisma);
  ctx.emails.length = 0;
});

describe('login', () => {
  it('autentica, devolve access token e grava refresh em cookie httpOnly/strict', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { res, body } = await login(ctx.app, 'ANA@meta.com ');

    expect(res.statusCode).toBe(200);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.usuario).toMatchObject({
      email: 'ana@meta.com',
      papel: { chave: 'admin' },
      trocarSenha: false,
    });
    expect(body.usuario.permissoes).toContain('users.manage');
    expect(body.usuario).not.toHaveProperty('senhaHash');

    const setCookie = String(res.headers['set-cookie']);
    expect(setCookie).toMatch(/mb_rt=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    expect(setCookie).toMatch(/Path=\/api\/auth/);
  });

  it('responde igual para e-mail inexistente e senha errada (não revela contas)', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const errada = await login(ctx.app, 'ana@meta.com', 'SenhaErrada999');
    const inexistente = await login(ctx.app, 'ninguem@meta.com');
    expect(errada.res.statusCode).toBe(401);
    expect(inexistente.res.statusCode).toBe(401);
    expect(errada.body.code).toBe('INVALID_CREDENTIALS');
    expect(inexistente.body).toEqual(errada.body);
  });

  it('valida a entrada com Zod e devolve erro padronizado', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'x' } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION', details: expect.any(Array) });
  });

  it('bloqueia após 5 falhas, mesmo com a senha certa depois', async () => {
    const u = await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    for (let i = 0; i < 4; i++)
      expect((await login(ctx.app, 'ana@meta.com', 'Errada12345')).res.statusCode).toBe(401);
    const quinta = await login(ctx.app, 'ana@meta.com', 'Errada12345');
    expect(quinta.res.statusCode).toBe(423);
    expect(quinta.body.code).toBe('ACCOUNT_LOCKED');

    const certa = await login(ctx.app, 'ana@meta.com');
    expect(certa.res.statusCode).toBe(423);

    const acoes = await ctx.prisma.auditLog.findMany({ where: { usuarioId: u.id }, select: { acao: true } });
    expect(acoes.map((a) => a.acao)).toContain('login.bloqueio');
  });

  it('recusa usuário desativado', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com', ativo: false });
    const { res, body } = await login(ctx.app, 'ana@meta.com');
    expect(res.statusCode).toBe(403);
    expect(body.code).toBe('ACCOUNT_DISABLED');
  });

  it('aplica rate limit no login', async () => {
    let ultimo = 0;
    for (let i = 0; i < 12; i++) {
      const r = await ctx.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { [HEADER_TESTAR_RATE_LIMIT]: '1' },
        payload: { email: 'x@meta.com', senha: 'y' },
      });
      ultimo = r.statusCode;
    }
    expect(ultimo).toBe(429);
  });
});

describe('refresh e logout', () => {
  it('rotaciona o refresh token e emite novo access token', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { body, refresh } = await login(ctx.app, 'ana@meta.com');

    const r = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', headers: cookie(refresh!) });
    expect(r.statusCode).toBe(200);
    const novo = cookieRefresh(r.headers['set-cookie']);
    expect(novo).toBeDefined();
    expect(novo).not.toBe(refresh);
    expect(r.json().accessToken).not.toBe(body.accessToken);
  });

  it('detecta reuso de refresh antigo e derruba a sessão inteira', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { refresh } = await login(ctx.app, 'ana@meta.com');
    const r1 = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', headers: cookie(refresh!) });
    const novo = cookieRefresh(r1.headers['set-cookie'])!;
    const accessNovo = r1.json().accessToken as string;

    // Reuso do token antigo (ex.: roubado) → 401 e revogação da família.
    const reuso = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: cookie(refresh!),
    });
    expect(reuso.statusCode).toBe(401);

    const comNovo = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', headers: cookie(novo) });
    expect(comNovo.statusCode).toBe(401);
    const me = await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: auth(accessNovo) });
    expect(me.statusCode).toBe(401);
  });

  it('expira a sessão por inatividade', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { refresh } = await login(ctx.app, 'ana@meta.com');
    await ctx.prisma.sessao.updateMany({ data: { ultimoUsoEm: new Date(Date.now() - 31 * 60_000) } });
    const r = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', headers: cookie(refresh!) });
    expect(r.statusCode).toBe(401);
  });

  it('refresh sem cookie é 401', async () => {
    const r = await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh' });
    expect(r.statusCode).toBe(401);
  });

  it('logout revoga a sessão: access e refresh deixam de valer', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { body, refresh } = await login(ctx.app, 'ana@meta.com');
    const out = await ctx.app.inject({ method: 'POST', url: '/api/auth/logout', headers: cookie(refresh!) });
    expect(out.statusCode).toBe(204);

    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: auth(body.accessToken) }))
        .statusCode,
    ).toBe(401);
    expect(
      (await ctx.app.inject({ method: 'POST', url: '/api/auth/refresh', headers: cookie(refresh!) }))
        .statusCode,
    ).toBe(401);
  });
});

describe('guard e permissões', () => {
  it('rota protegida sem token é 401 e com token adulterado é 401', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { body } = await login(ctx.app, 'ana@meta.com');
    expect((await ctx.app.inject({ method: 'GET', url: '/api/auth/me' })).statusCode).toBe(401);
    const adulterado = body.accessToken.slice(0, -2) + 'xx';
    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: auth(adulterado) })).statusCode,
    ).toBe(401);
  });

  it('papel sem users.manage recebe 403 em ação administrativa', async () => {
    const alvo = await criarUsuario(ctx.prisma, { email: 'alvo@meta.com' });
    await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
    const { body } = await login(ctx.app, 'rep@meta.com');
    const r = await ctx.app.inject({
      method: 'POST',
      url: `/api/usuarios/${alvo.id}/desativar`,
      headers: auth(body.accessToken),
    });
    expect(r.statusCode).toBe(403);
    expect(r.json().code).toBe('FORBIDDEN');
  });

  it('troca de senha pendente bloqueia tudo, exceto me/trocar-senha', async () => {
    const alvo = await criarUsuario(ctx.prisma, { email: 'alvo@meta.com' });
    await criarUsuario(ctx.prisma, { email: 'novo@meta.com', trocarSenha: true });
    const { body } = await login(ctx.app, 'novo@meta.com');
    expect(body.usuario.trocarSenha).toBe(true);

    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: auth(body.accessToken) }))
        .statusCode,
    ).toBe(200);
    const admin = await ctx.app.inject({
      method: 'POST',
      url: `/api/usuarios/${alvo.id}/derrubar-sessoes`,
      headers: auth(body.accessToken),
    });
    expect(admin.statusCode).toBe(403);
    expect(admin.json().code).toBe('PASSWORD_CHANGE_REQUIRED');
  });
});

describe('troca e redefinição de senha', () => {
  it('troca a senha, libera o acesso e derruba sessões antigas', async () => {
    await criarUsuario(ctx.prisma, { email: 'novo@meta.com', trocarSenha: true });
    const outraSessao = await login(ctx.app, 'novo@meta.com');
    const { body } = await login(ctx.app, 'novo@meta.com');

    const r = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      headers: auth(body.accessToken),
      payload: { senhaAtual: SENHA, novaSenha: 'NovaSenha2026', confirmacao: 'NovaSenha2026' },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().usuario.trocarSenha).toBe(false);

    const antiga = await ctx.app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: auth(outraSessao.body.accessToken),
    });
    expect(antiga.statusCode).toBe(401);
    expect((await login(ctx.app, 'novo@meta.com', 'NovaSenha2026')).res.statusCode).toBe(200);
  });

  it('recusa troca com senha atual errada', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const { body } = await login(ctx.app, 'ana@meta.com');
    const r = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      headers: auth(body.accessToken),
      payload: { senhaAtual: 'Errada12345', novaSenha: 'NovaSenha2026', confirmacao: 'NovaSenha2026' },
    });
    expect(r.statusCode).toBe(401);
  });

  it('esqueci a senha: responde 204 sempre e só envia e-mail para conta existente', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    const existe = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/esqueci-senha',
      payload: { email: 'ana@meta.com' },
    });
    const naoExiste = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/esqueci-senha',
      payload: { email: 'x@meta.com' },
    });
    expect(existe.statusCode).toBe(204);
    expect(naoExiste.statusCode).toBe(204);
    await new Promise((r) => setTimeout(r, 50));
    expect(ctx.emails).toHaveLength(1);
    expect(ctx.emails[0]!.para).toBe('ana@meta.com');
  });

  it('redefine a senha com o token do e-mail, uma única vez', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/esqueci-senha',
      payload: { email: 'ana@meta.com' },
    });
    await new Promise((r) => setTimeout(r, 50));
    const token = decodeURIComponent(/token=([^\s"&<]+)/.exec(ctx.emails[0]!.texto)![1]!);

    const payload = { token, novaSenha: 'Redefinida2026', confirmacao: 'Redefinida2026' };
    const r = await ctx.app.inject({ method: 'POST', url: '/api/auth/redefinir-senha', payload });
    expect(r.statusCode).toBe(204);
    expect((await login(ctx.app, 'ana@meta.com', 'Redefinida2026')).res.statusCode).toBe(200);

    const reuso = await ctx.app.inject({ method: 'POST', url: '/api/auth/redefinir-senha', payload });
    expect(reuso.statusCode).toBe(400);
  });

  it('token de redefinição expirado é recusado', async () => {
    await criarUsuario(ctx.prisma, { email: 'ana@meta.com' });
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/esqueci-senha',
      payload: { email: 'ana@meta.com' },
    });
    await new Promise((r) => setTimeout(r, 50));
    const token = decodeURIComponent(/token=([^\s"&<]+)/.exec(ctx.emails[0]!.texto)![1]!);
    await ctx.prisma.tokenRedefinicaoSenha.updateMany({ data: { expiraEm: new Date(Date.now() - 1000) } });

    const r = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/redefinir-senha',
      payload: { token, novaSenha: 'Redefinida2026', confirmacao: 'Redefinida2026' },
    });
    expect(r.statusCode).toBe(400);
  });
});

describe('administração de sessões', () => {
  it('admin desativa usuário: sessões dele morrem na hora', async () => {
    await criarUsuario(ctx.prisma, { email: 'admin@meta.com' });
    const alvo = await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
    const admin = await login(ctx.app, 'admin@meta.com');
    const rep = await login(ctx.app, 'rep@meta.com');

    const r = await ctx.app.inject({
      method: 'POST',
      url: `/api/usuarios/${alvo.id}/desativar`,
      headers: auth(admin.body.accessToken),
    });
    expect(r.statusCode).toBe(204);
    expect(
      (await ctx.app.inject({ method: 'GET', url: '/api/auth/me', headers: auth(rep.body.accessToken) }))
        .statusCode,
    ).toBe(401);
    expect((await login(ctx.app, 'rep@meta.com')).res.statusCode).toBe(403);

    const log = await ctx.prisma.auditLog.findFirst({ where: { acao: 'usuario.desativado' } });
    expect(log?.entidadeId).toBe(alvo.id);
  });

  it('admin não pode desativar a si mesmo', async () => {
    const admin = await criarUsuario(ctx.prisma, { email: 'admin@meta.com' });
    const { body } = await login(ctx.app, 'admin@meta.com');
    const r = await ctx.app.inject({
      method: 'POST',
      url: `/api/usuarios/${admin.id}/desativar`,
      headers: auth(body.accessToken),
    });
    expect(r.statusCode).toBe(409);
  });

  it('derrubar sessões invalida o refresh do usuário', async () => {
    await criarUsuario(ctx.prisma, { email: 'admin@meta.com' });
    const alvo = await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
    const admin = await login(ctx.app, 'admin@meta.com');
    const rep = await login(ctx.app, 'rep@meta.com');

    await ctx.app.inject({
      method: 'POST',
      url: `/api/usuarios/${alvo.id}/derrubar-sessoes`,
      headers: auth(admin.body.accessToken),
    });
    const r = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: cookie(rep.refresh!),
    });
    expect(r.statusCode).toBe(401);
  });
});

describe('erros e cabeçalhos', () => {
  it('não expõe detalhes internos e envia cabeçalhos de segurança', async () => {
    const r = await ctx.app.inject({ method: 'GET', url: '/api/health' });
    expect(r.statusCode).toBe(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-request-id']).toEqual(expect.any(String));

    const nf = await ctx.app.inject({ method: 'GET', url: '/api/nao-existe' });
    expect(nf.statusCode).toBe(404);
    expect(JSON.stringify(nf.json())).not.toMatch(/stack|prisma|at /i);
  });
});
