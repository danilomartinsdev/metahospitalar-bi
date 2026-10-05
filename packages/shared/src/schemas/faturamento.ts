import { z } from 'zod';
import { dataBR, decimalBR, type ErroLinha } from './importacao.js';

/**
 * Colunas do relatório diário de faturamento do Focco (domínio separado dos pedidos).
 * Uma linha por dia. "VLR FATURA DRE" = bruto + antecipado + remessa + devolução.
 */
export const COLUNAS_FATURAMENTO = {
  empresa: 'EMPRESA',
  ano: 'ANO',
  mes: 'MES',
  semana: 'SEMANA',
  data: 'DATA',
  bruto: 'VLR FAT BRUTO',
  antecipado: 'VLR FAT ANTECIP',
  remessa: 'VLR REMESSA',
  devolucao: 'VLR DEVOLUCAO',
  dre: 'VLR FATURA DRE',
} as const;
export type CampoFaturamento = keyof typeof COLUNAS_FATURAMENTO;

/** Célula vazia de valor = 0 (o relatório deixa em branco os dias sem movimento daquele tipo). */
const valor = (campo: string) =>
  z.string().transform((s, c) => {
    if (!s.trim()) return '0.00';
    const v = decimalBR(s);
    if (v === null) {
      c.addIssue({ code: 'custom', message: `${campo} inválido: "${s.slice(0, 30)}"` });
      return z.NEVER;
    }
    return v;
  });

const inteiro = (campo: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, { error: `${campo} inválido` })
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(min, { error: `${campo} fora do intervalo` })
        .max(max, { error: `${campo} fora do intervalo` }),
    );

const centavos = (s: string) => BigInt(s.replace('.', ''));

/** Valida e normaliza uma linha bruta (strings) do relatório de faturamento. */
export const linhaFaturamentoSchema = z
  .object({
    empresa: z.string().trim().min(1, { error: 'EMPRESA vazia' }).max(120),
    ano: inteiro('ANO', 2000, 2100),
    mes: inteiro('MES', 1, 12),
    semana: inteiro('SEMANA', 1, 53),
    // "08/01/2026 00:00:00" → "2026-01-08" (a hora é sempre 00:00:00 e é descartada).
    data: z.string().transform((s, c) => {
      const d = dataBR(s.trim().split(/\s+/)[0] ?? '');
      if (!d) {
        c.addIssue({ code: 'custom', message: `DATA inválida: "${s.slice(0, 30)}"` });
        return z.NEVER;
      }
      return d;
    }),
    bruto: valor('VLR FAT BRUTO'),
    antecipado: valor('VLR FAT ANTECIP'),
    remessa: valor('VLR REMESSA'),
    devolucao: valor('VLR DEVOLUCAO'),
    dre: valor('VLR FATURA DRE'),
  })
  .superRefine((l, c) => {
    if (Number(l.data.slice(0, 4)) !== l.ano || Number(l.data.slice(5, 7)) !== l.mes) {
      c.addIssue({ code: 'custom', message: 'DATA não bate com ANO/MES', path: ['data'] });
    }
    const soma = centavos(l.bruto) + centavos(l.antecipado) + centavos(l.remessa) + centavos(l.devolucao);
    const diff = soma - centavos(l.dre);
    if (diff > 1n || diff < -1n) {
      c.addIssue({
        code: 'custom',
        message: 'VLR FATURA DRE diferente de bruto + antecipado + remessa + devolução',
        path: ['dre'],
      });
    }
  });
export type LinhaFaturamento = z.output<typeof linhaFaturamentoSchema>;

const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: 'Mês no formato AAAA-MM' });
export const faturamentoQuerySchema = z
  .object({ de: mes.optional(), ate: mes.optional() })
  .refine((f) => !f.de || !f.ate || f.de <= f.ate, { error: 'Período inválido', path: ['ate'] });
export type FaturamentoQuery = z.output<typeof faturamentoQuerySchema>;

export const confirmarFaturamentoSchema = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  arquivoNome: z.string().trim().min(1).max(200),
});

/** Totais (strings decimais) das colunas do relatório. */
export interface TotaisFaturamento {
  bruto: string;
  antecipado: string;
  remessa: string;
  devolucao: string;
  dre: string;
}

export interface PreviaFaturamento {
  hash: string;
  arquivoNome: string;
  ano: number | null;
  dias: number;
  meses: { mes: number; dias: number; dre: string }[];
  totais: TotaisFaturamento;
  /** Dias do mesmo ano já gravados, que serão apagados ao confirmar. */
  diasSubstituidos: number;
  erros: ErroLinha[];
}

export interface LoteFaturamento {
  id: string;
  ano: number;
  arquivoNome: string;
  dias: number;
  totalDre: string;
  usuario: string | null;
  createdAt: string;
}

export interface FaturamentoResumo {
  periodo: { de: string; ate: string };
  temDados: boolean;
  kpis: Record<keyof TotaisFaturamento, { valor: string; anterior: string; pct: number | null }>;
  /** Mês a mês do ano de `ate` (cada coluna + DRE do mesmo mês do ano anterior). */
  mensal: {
    ano: number;
    meses: (TotaisFaturamento & { mes: number; dreAnoAnterior: string })[];
    total: TotaisFaturamento;
  };
  diario: { data: string; dre: string }[];
  semanal: { ano: number; semana: number; inicio: string; dre: string }[];
}
