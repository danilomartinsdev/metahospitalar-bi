// Cálculos de KPI puros (sem banco), em Decimal. Fórmulas: docs/dados/metricas-kpis.md.
import type { LinhaRanking } from '@meta-bi/shared';
import { Prisma } from '../../generated/prisma/client.js';

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;

export interface LinhaVenda {
  valor: Decimal;
  /** Mês de competência "AAAA-MM". */
  mes: string;
  uf: string;
  regiao: string;
  gestorId: string;
  gestorNome: string;
  clienteId: string;
  clienteNome: string;
  /** Segmento efetivo: override do cliente ?? padrão do representante. */
  segmento: 'PUBLICO' | 'PRIVADO' | null;
}

export const zero = () => new D(0);

export function somar(linhas: LinhaVenda[]): { total: Decimal; qtd: number } {
  return { total: linhas.reduce((s, l) => s.plus(l.valor), zero()), qtd: linhas.length };
}

export function ticket(total: Decimal, qtd: number): Decimal | null {
  return qtd === 0 ? null : total.div(qtd);
}

/** (atual − anterior) ÷ anterior; null se anterior = 0. */
export function variacao(atual: Decimal, anterior: Decimal): number | null {
  return anterior.isZero() ? null : atual.minus(anterior).div(anterior).toNumber();
}

export function fracao(parte: Decimal, total: Decimal): number | null {
  return total.isZero() ? null : parte.div(total).toNumber();
}

export function deslocarMes(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

export function mesesEntre(de: string, ate: string): string[] {
  const r: string[] = [];
  for (let m = de; m <= ate; m = deslocarMes(m, 1)) r.push(m);
  return r;
}

export const noPeriodo = (linhas: LinhaVenda[], de: string, ate: string) =>
  linhas.filter((l) => l.mes >= de && l.mes <= ate);

/** Agrupa e ordena por total desc, com % de participação no conjunto. */
export function agrupar(
  linhas: LinhaVenda[],
  chave: (l: LinhaVenda) => string,
  rotulo: (l: LinhaVenda) => string,
): LinhaRanking[] {
  const grupos = new Map<string, { rotulo: string; total: Decimal; qtd: number }>();
  for (const l of linhas) {
    const k = chave(l);
    const g = grupos.get(k) ?? { rotulo: rotulo(l), total: zero(), qtd: 0 };
    g.total = g.total.plus(l.valor);
    g.qtd++;
    grupos.set(k, g);
  }
  const geral = somar(linhas).total;
  return [...grupos]
    .map(([k, g]) => ({
      chave: k,
      rotulo: g.rotulo,
      total: g.total.toFixed(2),
      qtd: g.qtd,
      ticket: ticket(g.total, g.qtd)?.toFixed(2) ?? null,
      participacao: fracao(g.total, geral),
    }))
    .sort((a, b) => new D(b.total).comparedTo(new D(a.total)) || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

/** Série mensal (inclui meses sem venda como zero). */
export function serieMensal(linhas: LinhaVenda[], meses: string[], f: (ls: LinhaVenda[]) => Decimal) {
  const porMes = new Map<string, LinhaVenda[]>();
  for (const l of linhas) porMes.set(l.mes, [...(porMes.get(l.mes) ?? []), l]);
  return meses.map((mes) => ({ mes, valor: f(porMes.get(mes) ?? []) }));
}

/**
 * Acumulado do ano por segmento comparado SÓ nos meses em comum:
 * jan..mesFinal do ano atual vs jan..mesFinal do ano anterior.
 */
export function acumuladoPorSegmento(linhas: LinhaVenda[], ano: number, mesFinal: number) {
  const ate = (a: number) => `${a}-${String(mesFinal).padStart(2, '0')}`;
  const atual = noPeriodo(linhas, `${ano}-01`, ate(ano));
  const anterior = noPeriodo(linhas, `${ano - 1}-01`, ate(ano - 1));
  const segs = ['PUBLICO', 'PRIVADO', 'SEM'] as const;
  const de = (ls: LinhaVenda[], s: (typeof segs)[number]) =>
    somar(ls.filter((l) => (l.segmento ?? 'SEM') === s)).total;
  return {
    meses: mesFinal,
    linhas: segs
      .map((s) => ({ segmento: s, atual: de(atual, s), anterior: de(anterior, s) }))
      .filter((r) => !r.atual.isZero() || !r.anterior.isZero())
      .map((r) => ({
        segmento: r.segmento,
        atual: r.atual.toFixed(2),
        anterior: r.anterior.toFixed(2),
        pct: variacao(r.atual, r.anterior),
      })),
  };
}
