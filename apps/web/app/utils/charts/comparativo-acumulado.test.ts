import type { VisaoGeral } from '@meta-bi/shared';
import { describe, expect, it } from 'vitest';
import { buildComparativoAcumuladoOptions, categoriasAcumulado } from './comparativo-acumulado';
import { TEMA_CLARO } from './palette';

const acumulado: VisaoGeral['acumuladoSegmento'] = {
  meses: 8,
  periodo: { atual: { de: '2026-01', ate: '2026-08' }, anterior: { de: '2025-01', ate: '2025-08' } },
  total: { atual: '50000.00', anterior: '20000.00', pct: 1.5 },
  linhas: [
    { segmento: 'PUBLICO', atual: '25000.00', anterior: '12000.00', pct: 1.0833 },
    { segmento: 'PRIVADO', atual: '25000.00', anterior: '0.00', pct: null },
  ],
};

type Serie = { name: string; data: number[]; label?: { formatter: (p: { dataIndex: number }) => string } };

describe('buildComparativoAcumuladoOptions', () => {
  it('agrupa ano anterior × atual por segmento e põe o Total por último', () => {
    const o = buildComparativoAcumuladoOptions(acumulado, TEMA_CLARO);
    expect((o.xAxis as { data: string[] }).data).toEqual(['Público', 'Privado', 'Total']);
    const [ant, atual] = o.series as Serie[];
    expect(ant!.name).toBe('jan–ago/2025');
    expect(ant!.data).toEqual([12000, 0, 20000]);
    expect(atual!.name).toBe('jan–ago/2026');
    expect(atual!.data).toEqual([25000, 25000, 50000]);
  });

  it('rótulo mostra a variação com seta e fica vazio sem base de comparação', () => {
    const o = buildComparativoAcumuladoOptions(acumulado, TEMA_CLARO);
    const f = (o.series as Serie[])[1]!.label!.formatter;
    expect(f({ dataIndex: 0 })).toMatch(/^▲ 108,3\s?%$/);
    expect(f({ dataIndex: 1 })).toBe('');
    expect(f({ dataIndex: 2 })).toMatch(/^▲ 150,0\s?%$/);
  });

  it('sem vendas: sem categorias nem barras', () => {
    const vazio = { ...acumulado, total: { atual: '0.00', anterior: '0.00', pct: null }, linhas: [] };
    const o = buildComparativoAcumuladoOptions(vazio, TEMA_CLARO);
    expect((o.xAxis as { data: string[] }).data).toEqual([]);
    expect((o.series as Serie[]).every((s) => s.data.length === 0)).toBe(true);
  });

  it('categoriasAcumulado traduz o código do segmento', () => {
    expect(categoriasAcumulado(acumulado).map((c) => c.rotulo)).toEqual(['Público', 'Privado', 'Total']);
  });
});
