import type { LinhaRanking, VisaoGeral } from '@meta-bi/shared';
import { describe, expect, it } from 'vitest';
import { barrasRankingOptions, donutOptions, evolucaoOptions } from './options';
import { TEMA_CLARO } from './palette';

const linha = (rotulo: string, total: string): LinhaRanking => ({
  chave: rotulo,
  rotulo,
  total,
  qtd: 1,
  ticket: total,
  participacao: null,
});

const ev = (comMeta: boolean): VisaoGeral['evolucao'] => ({
  ano: 2026,
  meses: Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    real: String((i + 1) * 1000),
    anoAnterior: '500.00',
    meta: comMeta && i < 6 ? '2000.00' : null,
  })),
});

describe('evolucaoOptions', () => {
  it('gera Real, Ano anterior e Meta com 12 meses', () => {
    const o = evolucaoOptions(ev(true), TEMA_CLARO);
    const series = o.series as { name: string; data: (number | null)[] }[];
    expect(series.map((s) => s.name)).toEqual(['2026', '2025', 'Meta']);
    expect(series[0]!.data).toHaveLength(12);
    expect(series[0]!.data[7]).toBe(8000);
    expect(series[2]!.data[6]).toBeNull();
  });

  it('omite a série de meta quando não há metas', () => {
    const series = evolucaoOptions(ev(false), TEMA_CLARO).series as unknown[];
    expect(series).toHaveLength(2);
  });
});

describe('donutOptions', () => {
  it('agrupa a partir da 7ª fatia em "Outros"', () => {
    const ls = Array.from({ length: 9 }, (_, i) => linha(`R${i}`, '100.00'));
    const dados = (donutOptions(ls, TEMA_CLARO).series as { data: { name: string; value: number }[] }[])[0]!
      .data;
    expect(dados).toHaveLength(7);
    expect(dados[6]).toEqual({ name: 'Outros', value: 300 });
  });
});

describe('barrasRankingOptions', () => {
  it('limita e inverte para o maior ficar no topo', () => {
    const ls = [linha('A', '300'), linha('B', '200'), linha('C', '100')];
    const o = barrasRankingOptions(ls, TEMA_CLARO, 2);
    expect((o.yAxis as { data: string[] }).data).toEqual(['B', 'A']);
  });
});
