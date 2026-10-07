import { describe, expect, it } from 'vitest';
import { paginaInicial, visivelNoEscopo } from './navegacao';

describe('paginaInicial', () => {
  it('com a permissão e escopo restrito vai para Minhas vendas', () => {
    expect(paginaInicial({ escopoTipo: 'representantes', permissoes: ['minhas-vendas.view'] })).toBe(
      '/minhas-vendas',
    );
    expect(paginaInicial({ escopoTipo: 'regiao', permissoes: ['minhas-vendas.view'] })).toBe(
      '/minhas-vendas',
    );
  });

  it('sem a permissão vai para a Visão geral, mesmo sendo representante', () => {
    expect(paginaInicial({ escopoTipo: 'representantes', permissoes: ['dashboard.view'] })).toBe(
      '/dashboard',
    );
  });

  it('escopo "todos" (ex.: Admin, que tem todas as permissões) vai para a Visão geral', () => {
    expect(paginaInicial({ escopoTipo: 'todos', permissoes: ['minhas-vendas.view'] })).toBe('/dashboard');
    expect(paginaInicial(null)).toBe('/dashboard');
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
