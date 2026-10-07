import type { EscopoTipo, Permission } from '@meta-bi/shared';

/** Restrições de escopo de um item de menu ou de uma página. */
export interface RestricaoEscopo {
  /** Só aparece para estes escopos. */
  somenteEscopo?: readonly EscopoTipo[];
  /** Some para estes escopos (a rota continua acessível; os dados já vêm filtrados). */
  ocultarEscopo?: readonly EscopoTipo[];
}

export function visivelNoEscopo(r: RestricaoEscopo, escopoTipo: EscopoTipo | null | undefined): boolean {
  if (r.somenteEscopo && !(escopoTipo && r.somenteEscopo.includes(escopoTipo))) return false;
  if (r.ocultarEscopo && escopoTipo && r.ocultarEscopo.includes(escopoTipo)) return false;
  return true;
}

/**
 * Minhas vendas: exige a permissão (configurável em Papéis) e some para o escopo "todos" — quem vê a
 * empresa inteira já tem a Visão geral (e o Admin sempre tem todas as permissões).
 */
export const MINHAS_VENDAS = {
  permissao: 'minhas-vendas.view',
  ocultarEscopo: ['todos'],
} as const satisfies RestricaoEscopo & { permissao: Permission };

interface UsuarioNav {
  escopoTipo: EscopoTipo;
  permissoes: readonly Permission[];
}

/** Página inicial: Minhas vendas para quem pode vê-la; Visão geral para os demais. Só navegação. */
export function paginaInicial(usuario: UsuarioNav | null | undefined): string {
  return usuario &&
    usuario.permissoes.includes(MINHAS_VENDAS.permissao) &&
    visivelNoEscopo(MINHAS_VENDAS, usuario.escopoTipo)
    ? '/minhas-vendas'
    : '/dashboard';
}
