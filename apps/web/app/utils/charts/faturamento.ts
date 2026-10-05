// Gráficos da página de Faturamento (funções puras; os componentes só renderizam).
import type { FaturamentoResumo } from '@meta-bi/shared';
import type { EChartsOption } from 'echarts';
import { formatBRL, formatCompact } from '../format';
import type { TemaGrafico } from './palette';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const base = (t: TemaGrafico): EChartsOption => ({
  textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: t.texto },
  animationDuration: 300,
});
const tooltip = (t: TemaGrafico) => ({
  backgroundColor: t.fundo,
  borderColor: t.borda,
  textStyle: { color: t.texto, fontSize: 12 },
  trigger: 'axis' as const,
  valueFormatter: (v: unknown) => formatBRL(v as number),
});
const eixoValor = (t: TemaGrafico) => ({
  type: 'value' as const,
  axisLabel: { color: t.textoSuave, formatter: (v: number) => formatCompact(v) },
  splitLine: { lineStyle: { color: t.borda } },
});

/** Fatura DRE mês a mês (barras) × mesmo mês do ano anterior (linha tracejada). */
export function evolucaoFaturamentoOptions(m: FaturamentoResumo['mensal'], t: TemaGrafico): EChartsOption {
  const temAnterior = m.meses.some((x) => Number(x.dreAnoAnterior) !== 0);
  return {
    ...base(t),
    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { color: t.textoSuave }, itemWidth: 14, itemHeight: 8 },
    tooltip: tooltip(t),
    xAxis: {
      type: 'category',
      data: m.meses.map((x) => MESES[x.mes - 1]!),
      axisLine: { lineStyle: { color: t.borda } },
      axisLabel: { color: t.textoSuave },
      axisTick: { show: false },
    },
    yAxis: eixoValor(t),
    series: [
      {
        name: String(m.ano),
        type: 'bar',
        data: m.meses.map((x) => Number(x.dre)),
        itemStyle: { color: t.primaria, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 32,
      },
      ...(temAnterior
        ? [
            {
              name: String(m.ano - 1),
              type: 'line' as const,
              data: m.meses.map((x) => Number(x.dreAnoAnterior)),
              lineStyle: { type: 'dashed' as const, color: t.textoSuave, width: 2 },
              itemStyle: { color: t.textoSuave },
              symbol: 'circle',
              symbolSize: 5,
            },
          ]
        : []),
    ],
  };
}

/** Barras de Fatura DRE por dia ou por semana dentro do período. */
export function barrasFaturamentoOptions(
  pontos: { rotulo: string; dica: string; valor: number }[],
  t: TemaGrafico,
): EChartsOption {
  return {
    ...base(t),
    grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      ...tooltip(t),
      axisPointer: { type: 'shadow' },
      formatter: (p) => {
        const i = (p as { dataIndex: number }[])[0]?.dataIndex ?? 0;
        const ponto = pontos[i];
        return ponto ? `${ponto.dica}<br/><b>${formatBRL(ponto.valor)}</b>` : '';
      },
    },
    xAxis: {
      type: 'category',
      data: pontos.map((p) => p.rotulo),
      axisLine: { lineStyle: { color: t.borda } },
      axisLabel: { color: t.textoSuave, hideOverlap: true },
      axisTick: { show: false },
    },
    yAxis: eixoValor(t),
    series: [
      {
        type: 'bar',
        data: pontos.map((p) => p.valor),
        // Dias com valor negativo (só devolução) ficam na cor de alerta.
        itemStyle: {
          color: (p: { value: unknown }) => (Number(p.value) < 0 ? t.categorica[3]! : t.primaria),
          borderRadius: [3, 3, 0, 0],
        },
        barMaxWidth: 24,
      },
    ],
  };
}
