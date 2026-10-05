// Comparativo do acumulado do ano por segmento: ano anterior × ano atual, com a variação no topo.
import type { VisaoGeral } from '@meta-bi/shared';
import type { EChartsOption } from 'echarts';
import { formatBRL, formatCompact, formatPct } from '../format';
import type { TemaGrafico } from './palette';

type Acumulado = VisaoGeral['acumuladoSegmento'];

const ROTULO: Record<string, string> = { PUBLICO: 'Público', PRIVADO: 'Privado', SEM: 'Sem segmento' };

/** Categorias na ordem de exibição: segmentos com venda e, por último, o total. */
export function categoriasAcumulado(a: Acumulado) {
  return [
    ...a.linhas.map((l) => ({ rotulo: ROTULO[l.segmento] ?? l.segmento, ...l })),
    { rotulo: 'Total', segmento: 'TOTAL', ...a.total },
  ];
}

export function buildComparativoAcumuladoOptions(a: Acumulado, ano: number, t: TemaGrafico): EChartsOption {
  const cats = a.linhas.length ? categoriasAcumulado(a) : [];
  const seta = (p: number | null) => (p === null ? '' : `${p >= 0 ? '▲' : '▼'} ${formatPct(Math.abs(p))}`);
  return {
    textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: t.texto },
    animationDuration: 300,
    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { color: t.textoSuave }, itemWidth: 14, itemHeight: 8 },
    tooltip: {
      backgroundColor: t.fundo,
      borderColor: t.borda,
      textStyle: { color: t.texto, fontSize: 12 },
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) => formatBRL(v as number),
    },
    xAxis: {
      type: 'category',
      data: cats.map((c) => c.rotulo),
      axisLine: { lineStyle: { color: t.borda } },
      axisLabel: { color: t.textoSuave },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: t.textoSuave, formatter: (v: number) => formatCompact(v) },
      splitLine: { lineStyle: { color: t.borda } },
    },
    series: [
      {
        name: String(ano - 1),
        type: 'bar',
        data: cats.map((c) => Number(c.anterior)),
        itemStyle: { color: t.textoSuave, opacity: 0.45, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: String(ano),
        type: 'bar',
        data: cats.map((c) => Number(c.atual)),
        itemStyle: { color: t.primaria, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 28,
        label: {
          show: true,
          position: 'top',
          color: t.textoSuave,
          fontSize: 11,
          formatter: (p) => seta(cats[p.dataIndex]?.pct ?? null),
        },
        labelLayout: { hideOverlap: true },
      },
    ],
  };
}
