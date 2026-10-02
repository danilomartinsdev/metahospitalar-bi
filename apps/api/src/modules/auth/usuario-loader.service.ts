import { Injectable } from '@nestjs/common';
import { PERMISSIONS, type EscopoTipo, type Permission, type UsuarioLogado } from '@meta-bi/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UsuarioAutenticado } from '../../common/auth/types.js';

const ESCOPO: Record<string, EscopoTipo> = {
  TODOS: 'todos',
  REGIAO: 'regiao',
  REPRESENTANTES: 'representantes',
};
const PERMS = new Set<string>(PERMISSIONS);

/** Carrega o usuário a cada requisição: permissões sempre atuais e revogação imediata. */
@Injectable()
export class UsuarioLoader {
  constructor(private readonly prisma: PrismaService) {}

  /** Retorna null se o usuário estiver inativo ou a família de sessão revogada/expirada. */
  async carregar(usuarioId: string, familia: string): Promise<UsuarioAutenticado | null> {
    const u = await this.prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        ativo: true,
        sessoes: { some: { familia, revogadaEm: null, expiraEm: { gt: new Date() } } },
      },
      include: { role: { include: { permissoes: true } } },
    });
    if (!u) return null;
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: { chave: u.role.chave, nome: u.role.nome },
      permissoes: u.role.permissoes.map((p) => p.permissao).filter((p): p is Permission => PERMS.has(p)),
      escopoTipo: ESCOPO[u.escopoTipo] ?? 'representantes',
      trocarSenha: u.trocarSenha,
      sessaoFamilia: familia,
    };
  }

  static paraResposta(u: UsuarioAutenticado): UsuarioLogado {
    const { sessaoFamilia: _sessaoFamilia, ...publico } = u;
    return publico;
  }
}
