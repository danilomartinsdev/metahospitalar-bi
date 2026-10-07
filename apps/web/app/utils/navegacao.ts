import type { Permission } from '@meta-bi/shared';

/** Minhas vendas aparece só por permissão, marcada em Administração › Papéis. */
export const MINHAS_VENDAS = { permissao: 'minhas-vendas.view' } as const satisfies { permissao: Permission };

interface UsuarioNav {
  papel: { chave: string };
  permissoes: readonly Permission[];
}

/**
 * Página inicial: Minhas vendas para quem tem a permissão; Visão geral para os demais. O papel Admin
 * tem todas as permissões por regra (não dá para desmarcar), então continua na Visão geral — mas vê
 * o item no menu. Só navegação; os dados seguem o escopo no backend.
 */
export function paginaInicial(usuario: UsuarioNav | null | undefined): string {
  return usuario && usuario.papel.chave !== 'admin' && usuario.permissoes.includes(MINHAS_VENDAS.permissao)
    ? '/minhas-vendas'
    : '/dashboard';
}
