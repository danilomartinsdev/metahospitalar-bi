import { describe, expect, it } from 'vitest';
import { dataBR, decimalBR, linhaFoccoSchema, normalizarNome } from './importacao.js';

describe('decimalBR (sem float)', () => {
  it.each([
    ['83575,74920002', '83575.75'],
    ['22000,0004', '22000.00'],
    ['3000', '3000.00'],
    ['1.234,5', '1234.50'],
    ['0,005', '0.01'],
    ['0,004', '0.00'],
    ['-10,555', '-10.56'],
    ['999999999999,999', '1000000000000.00'],
  ])('%s → %s', (entrada, esperado) => {
    expect(decimalBR(entrada)).toBe(esperado);
  });

  it.each(['', 'abc', '1,2,3', '12a'])('rejeita %j', (v) => {
    expect(decimalBR(v)).toBeNull();
  });
});

describe('dataBR', () => {
  it('converte dd/mm/aa para 20aa', () => {
    expect(dataBR('05/01/26')).toBe('2026-01-05');
    expect(dataBR('5/1/2025')).toBe('2025-01-05');
  });
  it('rejeita datas impossíveis', () => {
    expect(dataBR('31/02/26')).toBeNull();
    expect(dataBR('2026-01-05')).toBeNull();
  });
});

describe('normalizarNome', () => {
  it('agrupa variações de acento, caixa e espaços', () => {
    expect(normalizarNome('  São  Camilo ')).toBe('SAO CAMILO');
    expect(normalizarNome('SAO CAMILO')).toBe('SAO CAMILO');
  });
});

describe('linhaFoccoSchema', () => {
  const base = {
    id: '57537',
    numPedido: '1128',
    ordemCpr: '',
    dtEmissao: '05/01/26',
    dtEntrega: '27/02/26',
    status: 'a',
    cliente: 'Hospital São José',
    uf: 'ex',
    representante: 'bl  repr',
    valor: '83575,74920002',
  };

  it('normaliza a linha e deriva região e competência', () => {
    const r = linhaFoccoSchema.parse(base);
    expect(r).toMatchObject({
      id: 57537,
      ordemCpr: null,
      dtEmissao: '2026-01-05',
      competencia: '2026-01-01',
      status: 'A',
      uf: 'EX',
      regiao: 'Exterior',
      representante: 'BL REPR',
      valor: '83575.75',
      clienteNormalizado: 'HOSPITAL SAO JOSE',
    });
  });

  it('acumula os motivos de erro da linha', () => {
    const r = linhaFoccoSchema.safeParse({ ...base, uf: 'XX', valor: 'abc', dtEmissao: '31/02/26' });
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining(['UF desconhecida', 'VALOR inválido', 'DT EMIS inválida']));
  });
});
