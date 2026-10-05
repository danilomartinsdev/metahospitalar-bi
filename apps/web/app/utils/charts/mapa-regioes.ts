// Mapa do Brasil por região (malha do IBGE em public/geo/br-regioes.json, registrada como "br-regioes").
// Sem filtro de região: intensidade proporcional à participação. Com filtro: selecionadas em destaque.
import { type LinhaRanking, REGIAO_ENUM_ROTULO, type RegiaoEnum } from '@meta-bi/shared';
import type { EChartsOption } from 'echarts';
import { formatBRL, formatInt, formatPct } from '../format';
import type { TemaGrafico } from './palette';

export const MAPA_REGIOES = 'br-regioes';
/** Regiões desenhadas no mapa (Exterior não tem área). */
export const REGIOES_MAPA = ['NORTE', 'NORDESTE', 'CENTRO_OESTE', 'SUDESTE', 'SUL'] as const;

export function buildMapaRegioesOptions(
  linhas: LinhaRanking[],
  selecionadas: string[],
  t: TemaGrafico,
): EChartsOption {
  const porChave = new Map(linhas.map((l) => [l.chave, l]));
  const maior = Math.max(0, ...REGIOES_MAPA.map((r) => porChave.get(r)?.participacao ?? 0));
  const filtrando = selecionadas.length > 0;

  const dados = REGIOES_MAPA.map((r) => {
    const l = porChave.get(r);
    const part = l?.participacao ?? 0;
    const destaque = filtrando ? selecionadas.includes(r) : part > 0;
    // Sem filtro: 25% a 100% de opacidade conforme a participação relativa à maior região.
    const opacidade = filtrando ? 1 : maior > 0 ? 0.25 + 0.75 * (part / maior) : 0.25;
    return {
      name: r,
      value: l ? Number(l.total) : 0,
      linha: l,
      itemStyle: {
        areaColor: destaque ? t.primaria : t.borda,
        opacity: destaque ? opacidade : 1,
        borderColor: t.fundo,
        borderWidth: 1.5,
      },
      label: { color: destaque && opacidade > 0.55 ? t.fundo : t.texto },
    };
  });

  /** O ECharts tipa os params de forma genérica; o item é sempre um dos `dados` acima. */
  const dadoDe = (p: unknown) => (p as { data: (typeof dados)[number] }).data;

  return {
    textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: t.texto },
    animationDuration: 300,
    tooltip: {
      trigger: 'item',
      backgroundColor: t.fundo,
      borderColor: t.borda,
      textStyle: { color: t.texto, fontSize: 12 },
      formatter: (p) => {
        const d = dadoDe(p);
        const nome = REGIAO_ENUM_ROTULO[d.name as RegiaoEnum];
        if (!d.linha) return `${nome}<br/>Sem vendas no período`;
        return `${nome}<br/><b>${formatBRL(d.linha.total)}</b> · ${formatPct(d.linha.participacao)}<br/>${formatInt(d.linha.qtd)} pedidos`;
      },
    },
    series: [
      {
        type: 'map',
        map: MAPA_REGIOES,
        roam: false,
        selectedMode: false,
        layoutCenter: ['50%', '50%'],
        layoutSize: '100%',
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 600,
          formatter: (p) => {
            const d = dadoDe(p);
            const nome = REGIAO_ENUM_ROTULO[d.name as RegiaoEnum];
            return d.linha ? `${nome}\n${formatPct(d.linha.participacao)}` : nome;
          },
        },
        emphasis: {
          label: { show: true, color: t.texto },
          itemStyle: { areaColor: t.destaque, opacity: 1 },
        },
        data: dados,
      },
    ],
  };
}
