import { describe, expect, it } from 'vitest';
import { paginaInicial, visivelNoEscopo } from './navegacao';

describe('paginaInicial', () => {
  it('representante vai para Minhas vendas; demais para a Visão geral', () => {
    expect(paginaInicial('representantes')).toBe('/minhas-vendas');
    expect(paginaInicial('todos')).toBe('/dashboard');
    expect(paginaInicial('regiao')).toBe('/dashboard');
    expect(paginaInicial(undefined)).toBe('/dashboard');
  });
});

describe('visivelNoEscopo', () => {
  it('sem restrição aparece para todos', () => {
    expect(visivelNoEscopo({}, 'representantes')).toBe(true);
    expect(visivelNoEscopo({}, 'todos')).toBe(true);
  });

  it('somenteEscopo mostra só para os escopos listados', () => {
    const r = { somenteEscopo: ['representantes'] as const };
    expect(visivelNoEscopo(r, 'representantes')).toBe(true);
    expect(visivelNoEscopo(r, 'todos')).toBe(false);
    expect(visivelNoEscopo(r, undefined)).toBe(false);
  });

  it('ocultarEscopo esconde para os escopos listados', () => {
    const r = { ocultarEscopo: ['representantes'] as const };
    expect(visivelNoEscopo(r, 'representantes')).toBe(false);
    expect(visivelNoEscopo(r, 'regiao')).toBe(true);
  });
});
