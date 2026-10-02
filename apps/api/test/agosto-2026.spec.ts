// Teste de aceite da Fase 3: KPIs de agosto/2026 com a planilha REAL (fixtures/focco/, fora do git).
// Valores esperados calculados à mão a partir do HTML bruto (soma em centavos inteiros), sem usar o código do sistema.
// Sem o arquivo real (ex.: CI), o teste é pulado.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

const REAL = path.resolve(import.meta.dirname, '../../../fixtures/focco/ano-todo-ate-agora.xls');

describe.skipIf(!fs.existsSync(REAL))('aceite: KPIs de agosto/2026 com a planilha real', () => {
  let ctx: Contexto;
  let token: string;

  beforeAll(async () => {
    ctx = await iniciarApp();
    await limparBanco(ctx.prisma);
    await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'gestor-comercial' });
    token = (await login(ctx.app, 'gestor@meta.com')).body.accessToken;

    const b = '----aceite';
    const payload = Buffer.concat([
      Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="real.xls"\r\n\r\n`),
      fs.readFileSync(REAL),
      Buffer.from(`\r\n--${b}--\r\n`),
    ]);
    const headers = { authorization: `Bearer ${token}` };
    const previa = (
      await ctx.app.inject({
        method: 'POST',
        url: '/api/import/previa',
        payload,
        headers: { ...headers, 'content-type': `multipart/form-data; boundary=${b}` },
      })
    ).json();
    expect(previa.erros).toEqual([]);
    await ctx.app.inject({
      method: 'POST',
      url: '/api/import/confirmar',
      headers,
      payload: { hash: previa.hash, arquivoNome: 'real.xls' },
    });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('total, quantidade, ticket, variação e rankings batem com o cálculo manual', async () => {
    const r = await ctx.app.inject({
      method: 'GET',
      url: '/api/dashboard/visao-geral?de=2026-08&ate=2026-08',
      headers: { authorization: `Bearer ${token}` },
    });
    const v = r.json();

    expect(v.kpis.total.valor).toBe('6049414.77');
    expect(v.kpis.qtd.valor).toBe('65.00');
    expect(v.kpis.ticket.valor).toBe('93067.92');
    // Julho/2026: 84 pedidos, R$ 5.328.925,20 → variação = 6.049.414,77 / 5.328.925,20 − 1
    expect(v.kpis.total.mesAnterior.anterior).toBe('5328925.20');
    expect(v.kpis.total.mesAnterior.pct).toBeCloseTo(0.1352035, 6);
    expect(
      v.topGestores.slice(0, 3).map((g: { rotulo: string; total: string }) => [g.rotulo, g.total]),
    ).toEqual([
      ['PPX', '2123817.76'],
      ['R DE CARVALHO', '1400465.40'],
      ['MURILLO', '1289241.72'],
    ]);
    expect(v.contagens).toMatchObject({ estados: 15, clientes: 54 });
  });
});
