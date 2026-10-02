import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Contexto, criarUsuario, iniciarApp, limparBanco, login } from './helpers.js';

const AMOSTRA = path.resolve(import.meta.dirname, '../../../fixtures/focco/amostras/amostra-anonimizada.xls');
let ctx: Contexto;
let token: string;

function multipart(nome: string, conteudo: Buffer) {
  const b = '----teste' + Date.now();
  const corpo = Buffer.concat([
    Buffer.from(
      `--${b}\r\nContent-Disposition: form-data; name="arquivo"; filename="${nome}"\r\nContent-Type: application/vnd.ms-excel\r\n\r\n`,
    ),
    conteudo,
    Buffer.from(`\r\n--${b}--\r\n`),
  ]);
  return {
    payload: corpo,
    headers: { 'content-type': `multipart/form-data; boundary=${b}`, authorization: `Bearer ${token}` },
  };
}

async function previa(buf: Buffer, nome = 'relatorio.xls') {
  const r = await ctx.app.inject({ method: 'POST', url: '/api/import/previa', ...multipart(nome, buf) });
  return { status: r.statusCode, body: r.json() };
}

async function importar(buf: Buffer) {
  const p = await previa(buf);
  const r = await ctx.app.inject({
    method: 'POST',
    url: '/api/import/confirmar',
    headers: { authorization: `Bearer ${token}` },
    payload: { hash: p.body.hash, arquivoNome: 'relatorio.xls' },
  });
  return { previa: p.body, status: r.statusCode, body: r.json() };
}

const contarPedidos = () =>
  ctx.prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM "Pedido"`.then((r) =>
    Number(r[0]!.n),
  );
const somaPedidos = () =>
  ctx.prisma.$queryRaw<{ s: string }[]>`SELECT coalesce(sum(valor), 0)::text AS s FROM "Pedido"`.then(
    (r) => r[0]!.s,
  );

beforeAll(async () => {
  ctx = await iniciarApp();
  process.env.UPLOAD_DIR = path.resolve(import.meta.dirname, '../storage/test-uploads');
});
afterAll(async () => {
  await ctx.app.close();
});
beforeEach(async () => {
  await limparBanco(ctx.prisma);
  await criarUsuario(ctx.prisma, { email: 'gestor@meta.com', papel: 'gestor-comercial' });
  token = (await login(ctx.app, 'gestor@meta.com')).body.accessToken;
});

describe('importação do relatório Focco', () => {
  const amostra = fs.readFileSync(AMOSTRA);

  it('prévia não grava nada e descreve o arquivo', async () => {
    const { status, body } = await previa(amostra);
    expect(status).toBe(200);
    expect(body).toMatchObject({
      formato: 'html',
      totalLinhas: 80,
      novos: 80,
      atualizados: 0,
      erros: [],
      jaImportado: false,
    });
    expect(body.statusNovos).toEqual(['A', 'AC', 'PE']);
    expect(body.representantesNovos.length).toBeGreaterThan(0);
    expect(body.periodo.de).toBe('2026-01-05');
    expect(await contarPedidos()).toBe(0);
  });

  it('importa tudo e reimportar não duplica', async () => {
    const r1 = await importar(amostra);
    expect(r1.status).toBe(200);
    expect(r1.body).toMatchObject({ novos: 80, atualizados: 0 });
    expect(await contarPedidos()).toBe(80);
    const soma = await somaPedidos();
    expect(soma).toBe(r1.previa.valorTotal);

    const r2 = await importar(amostra);
    expect(r2.previa).toMatchObject({ novos: 0, atualizados: 0, inalterados: 80, jaImportado: true });
    expect(await contarPedidos()).toBe(80);
  });

  it('detecta pedidos alterados e o rollback restaura o estado anterior', async () => {
    await importar(amostra);
    const somaOriginal = await somaPedidos();

    // Mesmo arquivo com um valor alterado e um pedido novo.
    const alterado = Buffer.from(
      amostra
        .toString('latin1')
        .replace('<td>3069,00</td>', '<td>9999,99</td>')
        .replace(
          '</table>',
          '<TR><td>99999</td><td>1</td><td></td><td>01/09/26</td><td></td><td>A</td><td>CLIENTE NOVO</td><td>GO</td><td>REP 001</td><td>100,00</td><td></td></TR></table>',
        ),
      'latin1',
    );
    const r = await importar(alterado);
    expect(r.body).toMatchObject({ novos: 1, atualizados: 1 });
    expect(await contarPedidos()).toBe(81);

    const lotes = (
      await ctx.app.inject({
        method: 'GET',
        url: '/api/import/lotes',
        headers: { authorization: `Bearer ${token}` },
      })
    ).json();
    expect(lotes).toHaveLength(2);
    const rb = await ctx.app.inject({
      method: 'POST',
      url: `/api/import/lotes/${lotes[0].id}/reverter`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(rb.statusCode).toBe(204);
    expect(await contarPedidos()).toBe(80);
    expect(await somaPedidos()).toBe(somaOriginal);
  });

  it('recusa reverter lote antigo cujos pedidos foram alterados depois', async () => {
    await importar(amostra);
    await importar(
      Buffer.from(amostra.toString('latin1').replace('<td>3069,00</td>', '<td>1,00</td>'), 'latin1'),
    );
    const lotes = (
      await ctx.app.inject({
        method: 'GET',
        url: '/api/import/lotes',
        headers: { authorization: `Bearer ${token}` },
      })
    ).json();
    const antigo = lotes.at(-1).id;
    const r = await ctx.app.inject({
      method: 'POST',
      url: `/api/import/lotes/${antigo}/reverter`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(409);
  });

  it('aponta erros por linha com o motivo', async () => {
    const ruim = Buffer.from(
      amostra
        .toString('latin1')
        .replace('<td>MG</td>', '<td>XX</td>')
        .replace('<td>05/01/26</td>', '<td>31/02/26</td>'),
      'latin1',
    );
    const { body } = await previa(ruim);
    expect(body.erros.length).toBeGreaterThan(0);
    const msgs = body.erros.flatMap((e: { mensagens: string[] }) => e.mensagens);
    expect(msgs).toEqual(expect.arrayContaining(['UF desconhecida']));
    expect(body.erros[0].linha).toBeGreaterThan(1);
  });

  it('rejeita arquivo que não é planilha, mesmo com extensão .xls', async () => {
    const { status, body } = await previa(Buffer.from('%PDF-1.7 conteúdo qualquer'), 'falso.xls');
    expect(status).toBe(400);
    expect(body.message).toMatch(/Formato não reconhecido/);
  });

  it('representante (sem import.run) recebe 403', async () => {
    await criarUsuario(ctx.prisma, { email: 'rep@meta.com', papel: 'representante' });
    token = (await login(ctx.app, 'rep@meta.com')).body.accessToken;
    const { status } = await previa(amostra);
    expect(status).toBe(403);
  });
});
