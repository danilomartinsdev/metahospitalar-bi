import { z } from 'zod';
import { PERMISSIONS, ESCOPO_TIPOS } from '../constants/permissions.js';

export const emailSchema = z
  .string({ error: 'Informe o e-mail' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'E-mail inválido' }));

/** Política de senha: mínimo 10 caracteres, com letra e número. */
export const senhaSchema = z
  .string({ error: 'Informe a senha' })
  .min(10, { error: 'A senha precisa ter pelo menos 10 caracteres' })
  .max(128, { error: 'A senha pode ter no máximo 128 caracteres' })
  .refine((s) => /[A-Za-z]/.test(s) && /\d/.test(s), { error: 'Use letras e números' });

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string({ error: 'Informe a senha' }).min(1, { error: 'Informe a senha' }).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, { error: 'Informe a senha atual' }).max(128),
    novaSenha: senhaSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmacao, { error: 'As senhas não conferem', path: ['confirmacao'] })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    error: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  });
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>;

export const esqueciSenhaSchema = z.object({ email: emailSchema });
export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(20).max(200),
    novaSenha: senhaSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmacao, { error: 'As senhas não conferem', path: ['confirmacao'] });
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;

export const usuarioLogadoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  papel: z.object({ chave: z.string(), nome: z.string() }),
  permissoes: z.array(z.enum(PERMISSIONS)),
  escopoTipo: z.enum(ESCOPO_TIPOS),
  trocarSenha: z.boolean(),
});
export type UsuarioLogado = z.infer<typeof usuarioLogadoSchema>;

export const authRespostaSchema = z.object({
  accessToken: z.string(),
  expiraEm: z.number().int(),
  usuario: usuarioLogadoSchema,
});
export type AuthResposta = z.infer<typeof authRespostaSchema>;
