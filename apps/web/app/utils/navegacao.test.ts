import { describe, expect, it } from 'vitest';
import { paginaInicial } from './navegacao';

const rep = { chave: 'representante' };

describe('paginaInicial', () => {
  it('com a permissão vai para Minhas vendas, qualquer que seja o escopo', () => {
    expect(paginaInicial({ papel: rep, permissoes: ['minhas-vendas.view'] })).toBe('/minhas-vendas');
    expect(paginaInicial({ papel: { chave: 'visualizador' }, permissoes: ['minhas-vendas.view'] })).toBe(
      '/minhas-vendas',
    );
  });

  it('sem a permissão vai para a Visão geral, mesmo sendo representante', () => {
    expect(paginaInicial({ papel: rep, permissoes: ['dashboard.view'] })).toBe('/dashboard');
    expect(paginaInicial(null)).toBe('/dashboard');
  });

  it('Admin (tem todas as permissões por regra) continua na Visão geral', () => {
    expect(paginaInicial({ papel: { chave: 'admin' }, permissoes: ['minhas-vendas.view'] })).toBe(
      '/dashboard',
    );
  });
});
