import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException, Erros } from '../../common/errors.js';
import type { ContextoRequisicao, UsuarioAutenticado } from '../../common/auth/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { SessaoService } from '../auth/sessao.service.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessoes: SessaoService,
    private readonly audit: AuditService,
  ) {}

  async desativar(id: string, admin: UsuarioAutenticado, ctx: ContextoRequisicao) {
    if (id === admin.id) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'Você não pode desativar o próprio usuário.');
    }
    await this.existe(id);
    await this.prisma.usuario.update({ where: { id }, data: { ativo: false } });
    const sessoes = await this.sessoes.revogarTodas(id);
    await this.audit.registrar({
      acao: 'usuario.desativado',
      usuarioId: admin.id,
      entidade: 'Usuario',
      entidadeId: id,
      detalhes: { sessoesRevogadas: sessoes },
      ctx,
    });
  }

  async reativar(id: string, admin: UsuarioAutenticado, ctx: ContextoRequisicao) {
    await this.existe(id);
    await this.prisma.usuario.update({
      where: { id },
      data: { ativo: true, tentativasFalhas: 0, bloqueadoAte: null },
    });
    await this.audit.registrar({
      acao: 'usuario.reativado',
      usuarioId: admin.id,
      entidade: 'Usuario',
      entidadeId: id,
      ctx,
    });
  }

  async derrubarSessoes(id: string, admin: UsuarioAutenticado, ctx: ContextoRequisicao) {
    await this.existe(id);
    const sessoes = await this.sessoes.revogarTodas(id);
    await this.audit.registrar({
      acao: 'usuario.sessoes-derrubadas',
      usuarioId: admin.id,
      entidade: 'Usuario',
      entidadeId: id,
      detalhes: { sessoesRevogadas: sessoes },
      ctx,
    });
  }

  private async existe(id: string) {
    const u = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!u) throw Erros.naoEncontrado();
  }
}
