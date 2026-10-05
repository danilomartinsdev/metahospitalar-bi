import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

let ctx: Contexto;
let token: string;
let outroId: string;

const patch = (body: unknown, t = token) =>
  ctx.app.inject({
    method: 'PATCH',
    url: '/api/auth/me/preferencias',
    headers: { authorization: `Bearer ${t}` },
    payload: body as object,
  });
const me = (t = token) =>
  ctx.app
    .inject({ method: 'GET', url: '/api/auth/me', headers: { authorization: `Bearer ${t}` } })
    .then((r) => r.json());

beforeAll(async () => {
  ctx = await iniciarApp();
  await limparBanco(ctx.prisma);
  await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
  outroId = (await criarUsuario(ctx.prisma, { email: 'outro@meta.com', papel: 'visualizador' })).id;
  token = (await login(ctx.app, 'rep@meta.com')).body.accessToken;
});

afterAll(async () => {
  await ctx.app.close();
});

describe('preferências do usuário (paleta dos gráficos)', () => {
  it('começa no padrão (null)', async () => {
    expect((await me()).paletaGraficos).toBeNull();
  });

  it('qualquer papel salva a própria paleta, e ela volta no /auth/me', async () => {
    const r = await patch({ paletaGraficos: 'esmeralda' });
    expect(r.statusCode).toBe(200);
    expect(r.json().paletaGraficos).toBe('esmeralda');
    expect((await me()).paletaGraficos).toBe('esmeralda');
  });

  it('só altera o próprio usuário (id do corpo é ignorado)', async () => {
    await patch({ paletaGraficos: 'vinho', id: outroId });
    const outro = await ctx.prisma.usuario.findUniqueOrThrow({ where: { id: outroId } });
    expect(outro.paletaGraficos).toBeNull();
  });

  it('null volta ao padrão', async () => {
    expect((await patch({ paletaGraficos: null })).json().paletaGraficos).toBeNull();
  });

  it('paleta inexistente → 400', async () => {
    expect((await patch({ paletaGraficos: 'arco-iris' })).statusCode).toBe(400);
  });

  it('sem login → 401', async () => {
    const r = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/auth/me/preferencias',
      payload: { paletaGraficos: 'grafite' },
    });
    expect(r.statusCode).toBe(401);
  });
});
