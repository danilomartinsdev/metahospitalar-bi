import type { EscopoTipo } from '@meta-bi/shared';

/**
 * Página inicial de cada usuário: representante (escopo "representantes vinculados") cai em
 * Minhas vendas; os demais na Visão geral. Só navegação — o escopo dos dados é do backend.
 */
export function paginaInicial(escopoTipo: EscopoTipo | null | undefined): string {
  return escopoTipo === 'representantes' ? '/minhas-vendas' : '/dashboard';
}

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
