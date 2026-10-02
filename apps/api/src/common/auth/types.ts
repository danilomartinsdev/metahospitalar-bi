import type { EscopoTipo, Permission } from '@meta-bi/shared';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  papel: { chave: string; nome: string };
  permissoes: Permission[];
  escopoTipo: EscopoTipo;
  trocarSenha: boolean;
  /** Família de sessão (login) a que o access token pertence. */
  sessaoFamilia: string;
}

export interface ContextoRequisicao {
  ip?: string;
  userAgent?: string;
}
