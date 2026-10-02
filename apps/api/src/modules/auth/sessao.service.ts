import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { ContextoRequisicao } from '../../common/auth/types.js';
import { TokenService } from './token.service.js';

export interface SessaoEmitida {
  refreshToken: string;
  familia: string;
  expiraEm: Date;
}

export type ResultadoRotacao =
  | { ok: true; usuarioId: string; sessao: SessaoEmitida }
  | { ok: false; motivo: 'inexistente' | 'revogada' | 'expirada' | 'inativa' | 'reuso' };

/**
 * Refresh tokens rotativos com detecção de reuso (ADR 0003).
 * Cada login cria uma "família"; cada refresh substitui o token e mantém a família.
 */
@Injectable()
export class SessaoService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async criar(usuarioId: string, ctx: ContextoRequisicao): Promise<SessaoEmitida> {
    const { token, hash } = this.tokens.gerarOpaco();
    const familia = randomUUID();
    const expiraEm = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    await this.prisma.sessao.create({
      data: {
        usuarioId,
        tokenHash: hash,
        familia,
        expiraEm,
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 300),
      },
    });
    return { refreshToken: token, familia, expiraEm };
  }

  async rotacionar(refreshToken: string, ctx: ContextoRequisicao): Promise<ResultadoRotacao> {
    const atual = await this.prisma.sessao.findUnique({
      where: { tokenHash: TokenService.hash(refreshToken) },
      include: { usuario: { select: { ativo: true } } },
    });
    if (!atual) return { ok: false, motivo: 'inexistente' };
    if (atual.revogadaEm) return { ok: false, motivo: 'revogada' };

    if (atual.substituidaEm) {
      // Token já usado: alguém está reaproveitando um refresh antigo → derruba a família inteira.
      await this.revogarFamilia(atual.familia);
      await this.audit.registrar({
        acao: 'sessao.reuso-detectado',
        usuarioId: atual.usuarioId,
        entidade: 'Sessao',
        entidadeId: atual.familia,
        ctx,
      });
      return { ok: false, motivo: 'reuso' };
    }

    const agora = Date.now();
    const ocioso = agora - atual.ultimoUsoEm.getTime() > this.env.SESSION_IDLE_TIMEOUT_MIN * 60_000;
    if (atual.expiraEm.getTime() <= agora || ocioso) {
      await this.revogarFamilia(atual.familia);
      return { ok: false, motivo: 'expirada' };
    }
    if (!atual.usuario.ativo) {
      await this.revogarFamilia(atual.familia);
      return { ok: false, motivo: 'inativa' };
    }

    const { token, hash } = this.tokens.gerarOpaco();
    // updateMany com substituidaEm=null garante que dois refresh simultâneos não rotacionem o mesmo token.
    const marcado = await this.prisma.$transaction(async (tx) => {
      const r = await tx.sessao.updateMany({
        where: { id: atual.id, substituidaEm: null, revogadaEm: null },
        data: { substituidaEm: new Date() },
      });
      if (r.count !== 1) return false;
      await tx.sessao.create({
        data: {
          usuarioId: atual.usuarioId,
          tokenHash: hash,
          familia: atual.familia,
          expiraEm: atual.expiraEm, // validade absoluta da família não é estendida
          ip: ctx.ip,
          userAgent: ctx.userAgent?.slice(0, 300),
        },
      });
      return true;
    });
    if (!marcado) return { ok: false, motivo: 'reuso' };

    return {
      ok: true,
      usuarioId: atual.usuarioId,
      sessao: { refreshToken: token, familia: atual.familia, expiraEm: atual.expiraEm },
    };
  }

  async familiaDoToken(refreshToken: string): Promise<{ familia: string; usuarioId: string } | null> {
    const s = await this.prisma.sessao.findUnique({
      where: { tokenHash: TokenService.hash(refreshToken) },
      select: { familia: true, usuarioId: true },
    });
    return s;
  }

  async revogarFamilia(familia: string): Promise<void> {
    await this.prisma.sessao.updateMany({
      where: { familia, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }

  async revogarTodas(usuarioId: string): Promise<number> {
    const r = await this.prisma.sessao.updateMany({
      where: { usuarioId, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
    return r.count;
  }
}
