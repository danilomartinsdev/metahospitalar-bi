import { describe, expect, it } from 'vitest';
import { formatBRL, formatCompact, formatDate, formatDateTime, formatInt, formatPct } from './format';

// Intl usa espaços não separáveis (U+00A0 e U+202F) entre "R$" e o número.
const ESPACOS_ESPECIAIS = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g');
const nbsp = (s: string) => s.replace(ESPACOS_ESPECIAIS, ' ');

describe('format', () => {
  it('formatBRL aceita string decimal da API e number', () => {
    expect(nbsp(formatBRL('83575.75'))).toBe('R$ 83.575,75');
    expect(nbsp(formatBRL(30000))).toBe('R$ 30.000,00');
  });

  it('formatPct recebe fração', () => {
    expect(nbsp(formatPct(0.8333))).toBe('83,3%');
    expect(nbsp(formatPct(-0.5))).toBe('-50,0%');
  });

  it('formatCompact e formatInt usam pt-BR', () => {
    expect(nbsp(formatCompact(1_250_000))).toBe('1,3 mi');
    expect(formatInt(1234)).toBe('1.234');
  });

  it('formatDate não desloca datas sem hora', () => {
    expect(formatDate('2026-08-05')).toBe('05/08/2026');
  });

  it('formatDateTime usa America/Sao_Paulo', () => {
    expect(formatDateTime('2026-08-05T03:30:00Z')).toBe('05/08/2026, 00:30');
  });

  it('valores ausentes ou inválidos viram travessão', () => {
    for (const v of [null, undefined, '', 'abc']) {
      expect(formatBRL(v)).toBe('—');
      expect(formatPct(v)).toBe('—');
    }
    expect(formatDate(null)).toBe('—');
    expect(formatDate('não é data')).toBe('—');
  });
});
