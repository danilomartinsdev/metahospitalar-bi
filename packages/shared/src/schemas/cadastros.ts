import { z } from 'zod';

export const SEGMENTOS = ['PUBLICO', 'PRIVADO'] as const;
export type Segmento = (typeof SEGMENTOS)[number];
export const SEGMENTO_ROTULO: Record<Segmento, string> = { PUBLICO: 'Público', PRIVADO: 'Privado' };

export const CORES_STATUS = ['muted', 'primary', 'highlight', 'success', 'warning', 'danger'] as const;

export const representanteUpdateSchema = z.object({
  nomeExibicao: z.string().trim().min(1).max(120).optional(),
  segmentoPadrao: z.enum(SEGMENTOS).nullable().optional(),
  ativo: z.boolean().optional(),
});
export type RepresentanteUpdate = z.infer<typeof representanteUpdateSchema>;

export const statusPdvUpdateSchema = z.object({
  descricao: z.string().trim().min(1).max(80).optional(),
  contaNoTotal: z.boolean().optional(),
  cor: z.enum(CORES_STATUS).optional(),
});
export type StatusPdvUpdate = z.infer<typeof statusPdvUpdateSchema>;

export const clienteUpdateSchema = z.object({ segmentoOverride: z.enum(SEGMENTOS).nullable() });
export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>;

export const clientesQuerySchema = z.object({
  busca: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

/** Valor monetário vindo do formulário: "1.234,56", "1234.56" ou número. */
export const valorMetaSchema = z.union([z.string(), z.number()]).transform((v, c) => {
  const s = String(v).trim();
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(norm)) {
    c.addIssue({ code: 'custom', message: 'Valor inválido' });
    return z.NEVER;
  }
  return norm;
});

export const metasSalvarSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
  metas: z
    .array(
      z.object({
        mes: z.number().int().min(1).max(12),
        representanteId: z.uuid().nullable(),
        valor: valorMetaSchema.nullable(),
      }),
    )
    .max(12 * 200),
});
export type MetasSalvar = z.infer<typeof metasSalvarSchema>;
