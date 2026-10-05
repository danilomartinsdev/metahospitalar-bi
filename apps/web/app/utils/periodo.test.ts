import { describe, expect, it } from 'vitest';
import { periodoCurto, periodoPorExtenso, variacoesKpi } from './periodo';

const kpi = { mesAnterior: { pct: 0.185 }, anoAnterior: { pct: -0.071 } };

describe('variacoesKpi', () => {
  it('acumulado (vários meses): só o mesmo período do ano anterior', () => {
    expect(variacoesKpi(kpi, { de: '2026-01', ate: '2026-09' })).toEqual([
      { rotulo: 'vs. jan–set/2025', pct: -0.071 },
    ]);
  });

  it('um mês: mês anterior e mesmo mês do ano anterior', () => {
    expect(variacoesKpi(kpi, { de: '2026-01', ate: '2026-01' })).toEqual([
      { rotulo: 'vs. dez/2025', pct: 0.185 },
      { rotulo: 'vs. jan/2025', pct: -0.071 },
    ]);
  });
});

describe('rótulos de período', () => {
  it('escreve o período por extenso e abreviado', () => {
    expect(periodoPorExtenso('2026-01', '2026-09')).toBe('janeiro a setembro de 2026');
    expect(periodoPorExtenso('2025-10', '2026-03')).toBe('outubro de 2025 a março de 2026');
    expect(periodoCurto('2026-09', '2026-09')).toBe('set/2026');
  });
});
