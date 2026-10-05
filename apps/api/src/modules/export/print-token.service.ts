import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Filtros } from '@meta-bi/shared';
import type { UsuarioAutenticado } from '../../common/auth/types.js';

interface Entrada {
  usuario: UsuarioAutenticado;
  filtros: Filtros;
  expira: number;
}

/**
 * Tokens de impressão (ADR 0004): uso único, 60 s, presos ao usuário e aos filtros do pedido de PDF.
 * Guarda um retrato do usuário já autenticado — a página de impressão vê exatamente o mesmo escopo.
 * Em memória: a API roda numa instância só; o token é consumido pelo Chromium da própria API.
 */
@Injectable()
export class PrintTokenService {
  static readonly TTL_MS = 60_000;
  private readonly tokens = new Map<string, Entrada>();

  criar(usuario: UsuarioAutenticado, filtros: Filtros, agora = Date.now()): string {
    for (const [t, e] of this.tokens) if (e.expira <= agora) this.tokens.delete(t);
    const token = randomBytes(32).toString('base64url');
    this.tokens.set(token, { usuario, filtros, expira: agora + PrintTokenService.TTL_MS });
    return token;
  }

  /** Devolve e invalida o token; null se não existe, já foi usado ou expirou. */
  consumir(token: string, agora = Date.now()): Omit<Entrada, 'expira'> | null {
    const e = this.tokens.get(token);
    this.tokens.delete(token);
    if (!e || e.expira <= agora) return null;
    return { usuario: e.usuario, filtros: e.filtros };
  }

  /** Invalida um token não consumido (ex.: o Chromium falhou antes de abrir a página). */
  descartar(token: string) {
    this.tokens.delete(token);
  }
}
