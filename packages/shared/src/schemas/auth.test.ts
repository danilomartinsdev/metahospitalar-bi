import { describe, expect, it } from 'vitest';
import { loginSchema, senhaSchema, trocarSenhaSchema } from './auth.js';
import { regiaoDaUf } from '../constants/regioes.js';

describe('loginSchema', () => {
  it('normaliza o e-mail', () => {
    expect(loginSchema.parse({ email: '  Ana@Meta.COM ', senha: 'x' }).email).toBe('ana@meta.com');
  });
  it('rejeita e-mail inválido', () => {
    expect(loginSchema.safeParse({ email: 'ana', senha: 'x' }).success).toBe(false);
  });
});

describe('senhaSchema', () => {
  it('aceita senha com letras e números e 10+ caracteres', () => {
    expect(senhaSchema.safeParse('senhaForte123').success).toBe(true);
  });
  it('rejeita senha curta ou só letras', () => {
    expect(senhaSchema.safeParse('abc123').success).toBe(false);
    expect(senhaSchema.safeParse('somenteletras').success).toBe(false);
  });
});

describe('trocarSenhaSchema', () => {
  it('exige confirmação igual', () => {
    const r = trocarSenhaSchema.safeParse({
      senhaAtual: 'a',
      novaSenha: 'novaSenha123',
      confirmacao: 'outra',
    });
    expect(r.success).toBe(false);
  });
  it('exige senha nova diferente da atual', () => {
    const r = trocarSenhaSchema.safeParse({
      senhaAtual: 'novaSenha123',
      novaSenha: 'novaSenha123',
      confirmacao: 'novaSenha123',
    });
    expect(r.success).toBe(false);
  });
});

describe('regiaoDaUf', () => {
  it('mapeia UF e exportação', () => {
    expect(regiaoDaUf('go')).toBe('Centro-Oeste');
    expect(regiaoDaUf('EX')).toBe('Exterior');
  });
  it('retorna undefined para UF desconhecida', () => {
    expect(regiaoDaUf('XX')).toBeUndefined();
  });
});
