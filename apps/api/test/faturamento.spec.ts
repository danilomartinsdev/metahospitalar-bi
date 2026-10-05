import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

// Amostra sintética (valores fictícios) no formato do relatório diário do Focco.
const AMOSTRA = path.resolve(
  import.meta.dirname,
  '../../../fixtures/faturamento/amostras/faturamento-amostra.xls',
);
let ctx: Contexto;
let tokenGestor: string;

function multipart(arquivo: Buffer, nome = 'faturamento.xls') {
  const b = '----faturamento';
  return {
    payload: Buffer.concat([
      Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="${nome}"\r\n\r\n`),
      arquivo,
      Buffer.from(`\r\n--${b}--\r\n`),
    ]),
    contentType: `multipart/form-data; boundary=${b}`,
  };
}

const req = (method: 'GET' | 'POST', url: string, token: string, extra: object = {}) =>
  ctx.app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, ...extra });

async function importar(token: string, arquivo = fs.readFileSync(AMOSTRA)) {
  const m = multipart(arquivo);
  const previa = await req('POST', '/api/faturamento/import/previa', token, {
    payload: m.payload,
    headers: { authorization: `Bearer ${token}`, 'content-type': m.contentType },
  });
  const p = previa.json();
  const conf = await req('POST', '/api/faturamento/import/confirmar', token, {
    payload: { hash: p.hash, arquivoNome: 'faturamento.xls' },
  });
  return { previa: p, statusPrevia: previa.statusCode, confirmar: conf };
}

beforeAll(async () => {
  ctx = await iniciarApp();
  await limparBanco(ctx.prisma);
  await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'gestor-comercial' });
  tokenGestor = (await login(ctx.app, 'gestor@meta.com')).body.accessToken;
});

afterAll(async () => {
  await ctx.app.close();
});

describe('faturamento — importação', () => {
  it('prévia lê o relatório: ano, dias, meses e totais (DRE = soma das parcelas)', async () => {
    const { previa, statusPrevia } = await importar(tokenGestor);
    expect(statusPrevia).toBe(200);
    expect(previa).toMatchObject({
      ano: 2026,
      dias: 6,
      erros: [],
      diasSubstituidos: 0,
      totais: {
        bruto: '8000.60',
        antecipado: '-300.10',
        remessa: '250.00',
        devolucao: '-150.25',
        dre: '7800.25',
      },
      meses: [
        { mes: 1, dias: 4, dre: '4400.25' },
        { mes: 2, dias: 2, dre: '3400.00' },
      ],
    });
  });

  it('reimportar o mesmo ano substitui os dias (não duplica)', async () => {
    const { previa, confirmar } = await importar(tokenGestor);
    expect(previa.diasSubstituidos).toBe(6);
    expect(confirmar.statusCode).toBe(200);
    expect(confirmar.json()).toMatchObject({ ano: 2026, dias: 6, substituidos: 6 });
    expect(await ctx.prisma.faturamentoDia.count()).toBe(6);
    expect(await ctx.prisma.faturamentoLote.count()).toBe(2);
  });

  it('arquivo com DRE que não fecha aparece como erro de linha e não é gravado', async () => {
    const quebrado = fs.readFileSync(AMOSTRA, 'latin1').replace('<td>1649,75</td>', '<td>1600</td>');
    const { previa, confirmar } = await importar(tokenGestor, Buffer.from(quebrado, 'latin1'));
    expect(previa.erros).toHaveLength(1);
    expect(previa.erros[0].mensagens[0]).toContain('VLR FATURA DRE');
    expect(confirmar.statusCode).toBe(400);
  });
});

describe('faturamento — resumo', () => {
  it('cards, mês a mês e séries do período', async () => {
    const r = await req('GET', '/api/faturamento/resumo?de=2026-01&ate=2026-02', tokenGestor);
    expect(r.statusCode).toBe(200);
    const b = r.json();
    expect(b.periodo).toEqual({ de: '2026-01', ate: '2026-02' });
    expect(b.kpis.dre).toEqual({ valor: '7800.25', anterior: '0.00', pct: null });
    expect(b.kpis.devolucao.valor).toBe('-150.25');
    expect(b.mensal.meses.map((m: { mes: number; dre: string }) => [m.mes, m.dre])).toEqual([
      [1, '4400.25'],
      [2, '3400.00'],
    ]);
    expect(b.mensal.total.dre).toBe('7800.25');
    expect(b.diario).toHaveLength(6);
    expect(b.semanal.map((s: { semana: number; dre: string }) => [s.semana, s.dre])).toEqual([
      [1, '1000.50'],
      [2, '3399.75'],
      [6, '3400.00'],
    ]);
  });

  it('sem período informado: de janeiro até o último mês com faturamento', async () => {
    const b = (await req('GET', '/api/faturamento/resumo', tokenGestor)).json();
    expect(b.periodo).toEqual({ de: '2026-01', ate: '2026-02' });
  });
});

describe('faturamento — acesso', () => {
  it('papel sem a permissão (representante) recebe 403', async () => {
    await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
    const t = (await login(ctx.app, 'rep@meta.com')).body.accessToken;
    expect((await req('GET', '/api/faturamento/resumo', t)).statusCode).toBe(403);
  });

  it('com a permissão mas escopo parcial (por representante) recebe 403', async () => {
    const u = await criarUsuario(ctx.prisma, { email: 'gestor-parcial@meta.com', papel: 'gestor-comercial' });
    await ctx.prisma.usuario.update({ where: { id: u.id }, data: { escopoTipo: 'REPRESENTANTES' } });
    const t = (await login(ctx.app, 'gestor-parcial@meta.com')).body.accessToken;
    expect((await req('GET', '/api/faturamento/resumo', t)).statusCode).toBe(403);
    const m = multipart(fs.readFileSync(AMOSTRA));
    const r = await req('POST', '/api/faturamento/import/previa', t, {
      payload: m.payload,
      headers: { authorization: `Bearer ${t}`, 'content-type': m.contentType },
    });
    expect(r.statusCode).toBe(403);
  });

  it('sem login recebe 401', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/api/faturamento/resumo' })).statusCode).toBe(401);
  });
});
