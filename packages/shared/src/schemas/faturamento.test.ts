import { describe, expect, it } from 'vitest';
import { linhaFaturamentoSchema } from './faturamento.js';

// Formato real do relatório: números pt-BR sem milhar, data com hora, colunas vazias = 0.
const linha = (sobre: Partial<Record<string, string>> = {}) => ({
  empresa: '1 - META MOVEIS',
  ano: '2026',
  mes: '01',
  semana: '02',
  data: '08/01/2026 00:00:00',
  bruto: '751189',
  antecipado: '-145900',
  remessa: '',
  devolucao: '-15114,5',
  dre: '590174,5',
  ...sobre,
});

describe('linhaFaturamentoSchema', () => {
  it('normaliza uma linha válida (data sem hora, vazio = 0, decimais com 2 casas)', () => {
    const r = linhaFaturamentoSchema.parse(linha());
    expect(r).toEqual({
      empresa: '1 - META MOVEIS',
      ano: 2026,
      mes: 1,
      semana: 2,
      data: '2026-01-08',
      bruto: '751189.00',
      antecipado: '-145900.00',
      remessa: '0.00',
      devolucao: '-15114.50',
      dre: '590174.50',
    });
  });

  it('dia sem movimento: tudo zero é válido', () => {
    const r = linhaFaturamentoSchema.parse(
      linha({
        bruto: '',
        antecipado: '',
        devolucao: '',
        dre: '0',
        data: '01/01/2026 00:00:00',
        semana: '01',
      }),
    );
    expect(r.dre).toBe('0.00');
  });

  it('recusa DRE que não fecha com a soma das parcelas', () => {
    const r = linhaFaturamentoSchema.safeParse(linha({ dre: '590000' }));
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(
      'VLR FATURA DRE diferente de bruto + antecipado + remessa + devolução',
    );
  });

  it('recusa data inválida e data fora do ANO/MES', () => {
    expect(linhaFaturamentoSchema.safeParse(linha({ data: '32/01/2026 00:00:00' })).success).toBe(false);
    const r = linhaFaturamentoSchema.safeParse(linha({ data: '08/02/2026 00:00:00' }));
    expect(r.error?.issues.map((i) => i.message)).toContain('DATA não bate com ANO/MES');
  });

  it('recusa valor que não é número', () => {
    expect(linhaFaturamentoSchema.safeParse(linha({ bruto: 'abc' })).success).toBe(false);
  });
});
