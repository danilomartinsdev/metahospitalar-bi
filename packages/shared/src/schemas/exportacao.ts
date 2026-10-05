import { z } from 'zod';
import { type Filtros, filtrosSchema, type Ranking, type VisaoGeral } from './dashboard.js';

/** O que pode ser exportado em Excel (uma planilha por tela de análise). */
export const EXPORT_XLSX_TIPOS = ['pedidos', 'gestores', 'estados', 'regioes', 'clientes'] as const;
export type ExportXlsxTipo = (typeof EXPORT_XLSX_TIPOS)[number];

/** Filtros globais + ordenação (usada só na exportação de pedidos). */
export const exportXlsxQuerySchema = z.intersection(
  filtrosSchema,
  z.object({
    sort: z.enum(['dtEmissao', 'valor', 'numPedido', 'cliente', 'uf', 'representante']).default('dtEmissao'),
    dir: z.enum(['asc', 'desc']).default('desc'),
  }),
);
export type ExportXlsxQuery = z.output<typeof exportXlsxQuerySchema>;

/** Token de impressão: base64url de 32 bytes. */
export const printTokenSchema = z.object({ token: z.string().regex(/^[\w-]{43}$/) });

/** Dados do relatório executivo em PDF (rota /print/relatorio da SPA). */
export interface RelatorioImpressao {
  geradoPor: string;
  geradoEm: string;
  filtros: Filtros;
  visaoGeral: VisaoGeral;
  rankings: { gestores: Ranking; estados: Ranking; regioes: Ranking };
}
