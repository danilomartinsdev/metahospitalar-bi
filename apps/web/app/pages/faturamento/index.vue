<script setup lang="ts">
import { useFaturamentoResumoQuery } from '~/composables/api/useFaturamento';
import {
  alturaBarrasFaturamento,
  barrasFaturamentoOptions,
  evolucaoFaturamentoOptions,
} from '~/utils/charts/faturamento';
import { anoAnterior, deslocarMes, periodoCurto, periodoPorExtenso } from '~/utils/periodo';

// Faturamento: domínio separado dos pedidos (relatório diário do Focco). Não altera outras telas.
definePageMeta({ titulo: 'Faturamento', permissao: 'faturamento.view' });
useHead({ title: 'Faturamento — BI Metahospitalar' });

const route = useRoute();
const router = useRouter();
const can = useCan();
const importando = ref(false);

const mesValido = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : undefined;
const de = computed(() => mesValido(route.query.de));
const ate = computed(() => mesValido(route.query.ate));
const qs = computed(() =>
  new URLSearchParams(
    Object.entries({ de: de.value, ate: ate.value }).filter(([, v]) => v) as [string, string][],
  ).toString(),
);
const q = useFaturamentoResumoQuery(qs);
const r = computed(() => q.data.value);
const carregando = computed(() => q.isPending.value);

function definir(novo: { de?: string; ate?: string }) {
  void router.replace({ query: { ...route.query, ...novo } });
}
function mudar(campo: 'de' | 'ate', valor: string) {
  const p = {
    de: de.value ?? r.value?.periodo.de ?? valor,
    ate: ate.value ?? r.value?.periodo.ate ?? valor,
    [campo]: valor,
  };
  if (p.de > p.ate) {
    if (campo === 'de') p.ate = p.de;
    else p.de = p.ate;
  }
  definir(p);
}

// Meses do seletor: dos últimos 3 anos até o mês atual.
const NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const opcoesMes = computed(() => {
  const hoje = new Date().toISOString().slice(0, 7);
  const lista: { label: string; value: string }[] = [];
  for (let m = `${Number(hoje.slice(0, 4)) - 2}-01`; m <= hoje; m = deslocarMes(m, 1)) {
    lista.unshift({ label: `${NOMES[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`, value: m });
  }
  return lista;
});

const periodo = computed(() => r.value?.periodo);
const ant = computed(() => (periodo.value ? anoAnterior(periodo.value) : null));
const rotuloAnterior = computed(() => (ant.value ? `vs. ${periodoCurto(ant.value.de, ant.value.ate)}` : ''));
const kpi = (k: 'dre' | 'bruto' | 'antecipado' | 'remessa' | 'devolucao') => r.value?.kpis[k];
const variacoes = (k: 'dre' | 'bruto' | 'antecipado' | 'remessa' | 'devolucao') =>
  r.value ? [{ rotulo: rotuloAnterior.value, pct: r.value.kpis[k].pct }] : [];

const CARDS = [
  { k: 'dre', rotulo: 'Fatura DRE', icone: 'i-lucide-dollar-sign' },
  { k: 'bruto', rotulo: 'Faturamento bruto', icone: 'i-lucide-receipt' },
  { k: 'devolucao', rotulo: 'Devoluções', icone: 'i-lucide-arrow-down-left' },
  { k: 'antecipado', rotulo: 'Antecipações', icone: 'i-lucide-calendar-clock' },
  { k: 'remessa', rotulo: 'Remessas', icone: 'i-lucide-truck' },
] as const;

const visao = ref<'dia' | 'semana'>('semana');
const ABAS = [
  { label: 'Por semana', value: 'semana' },
  { label: 'Por dia', value: 'dia' },
];
const MESES_EXTENSO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const pontoDia = (d: { data: string; dre: string }) => {
  const dia = SEMANA[new Date(`${d.data}T12:00:00Z`).getUTCDay()];
  return {
    rotulo: `${dia} ${ddmm(d.data)}`,
    dica: `${dia}, ${ddmm(d.data)}/${d.data.slice(0, 4)}`,
    valor: Number(d.dre),
  };
};

// Filtro de mês (vale para "Por dia" e "Por semana"; padrão: o último mês do período).
// "Por semana" aceita também o período inteiro.
const PERIODO = 'periodo';
const mesesDoPeriodo = computed(() => [...new Set((r.value?.diario ?? []).map((d) => d.data.slice(0, 7)))]);
const mesSel = ref<string>();
watch(
  mesesDoPeriodo,
  (ms) => {
    if (!mesSel.value || (mesSel.value !== PERIODO && !ms.includes(mesSel.value))) mesSel.value = ms.at(-1);
  },
  { immediate: true },
);
const opcoesMesGrafico = computed(() => [
  ...(visao.value === 'semana' ? [{ label: 'Todo o período', value: PERIODO }] : []),
  ...[...mesesDoPeriodo.value]
    .reverse()
    .map((m) => ({ label: `${MESES_EXTENSO[Number(m.slice(5)) - 1]} de ${m.slice(0, 4)}`, value: m })),
]);
// "Por dia" não tem "Todo o período": volta para o último mês.
watch(visao, (v) => {
  if (v === 'dia' && mesSel.value === PERIODO) mesSel.value = mesesDoPeriodo.value.at(-1);
});
const diasDoMes = computed(() =>
  (r.value?.diario ?? []).filter((d) => mesSel.value === PERIODO || d.data.startsWith(mesSel.value ?? '')),
);

// "Por semana": as semanas do mês escolhido (contando só os dias dele, para o total bater com o do mês)
// ou os dias de uma semana. As semanas são identificadas pelas datas, não pelo número do relatório.
const TODAS = 'todas';
const chaveSemana = (s: { ano: number; semana: number }) => `${s.ano}-${s.semana}`;
const semanaSel = ref<string>(TODAS);
watch([qs, mesSel], () => (semanaSel.value = TODAS));
const semanas = computed(() => {
  const grupos = new Map<string, { chave: string; inicio: string; fim: string; dre: number }>();
  for (const d of diasDoMes.value) {
    const k = chaveSemana(d);
    const g = grupos.get(k) ?? { chave: k, inicio: d.data, fim: d.data, dre: 0 };
    g.fim = d.data;
    g.dre += Number(d.dre);
    grupos.set(k, g);
  }
  return [...grupos.values()].map((g) => ({
    ...g,
    intervalo: `${ddmm(g.inicio)} a ${ddmm(g.fim)}/${g.fim.slice(0, 4)}`,
  }));
});
const opcoesSemana = computed(() => [
  { label: 'Todas as semanas', value: TODAS },
  ...semanas.value.map((s) => ({ label: s.intervalo, value: s.chave })),
]);

const pontos = computed(() => {
  if (visao.value === 'dia') return diasDoMes.value.map(pontoDia);
  if (semanaSel.value !== TODAS) {
    return diasDoMes.value.filter((d) => chaveSemana(d) === semanaSel.value).map(pontoDia);
  }
  // Cada barra = uma semana, rotulada pelo intervalo de datas.
  return semanas.value.map((s) => ({
    rotulo: s.intervalo.slice(0, 13),
    dica: `Semana de ${s.intervalo}`,
    valor: s.dre,
  }));
});
/** Total do que está no gráfico (só para leitura; os totais oficiais vêm da API em Decimal). */
const totalPontos = computed(() => pontos.value.reduce((t, p) => t + p.valor, 0));
const COLUNAS_TABELA = [
  { k: 'bruto', r: 'Bruto' },
  { k: 'antecipado', r: 'Antecipado' },
  { k: 'remessa', r: 'Remessa' },
  { k: 'devolucao', r: 'Devolução' },
] as const;
const atalho = (tipo: 'ano' | 'mes') => {
  const fim = r.value?.periodo.ate;
  if (!fim) return;
  definir(tipo === 'ano' ? { de: `${fim.slice(0, 4)}-01`, ate: fim } : { de: fim, ate: fim });
};
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">Faturamento</h2>
        <p class="text-sm text-muted-foreground">
          {{ periodo ? periodoPorExtenso(periodo.de, periodo.ate) : 'Carregando período…' }}
          <template v-if="r?.temDados"> · relatório diário de faturamento do Focco</template>
        </p>
      </div>
      <UButton
        v-if="can('faturamento.import')"
        icon="i-lucide-file-up"
        label="Importar planilha"
        @click="importando = true"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <UIcon name="i-lucide-calendar-days" class="size-4 text-muted-foreground" />
      <USelect
        :model-value="periodo?.de"
        :items="opcoesMes"
        size="sm"
        class="w-28"
        aria-label="Mês inicial"
        @update:model-value="(v) => mudar('de', String(v))"
      />
      <span class="text-sm text-muted-foreground">até</span>
      <USelect
        :model-value="periodo?.ate"
        :items="opcoesMes"
        size="sm"
        class="w-28"
        aria-label="Mês final"
        @update:model-value="(v) => mudar('ate', String(v))"
      />
      <UButton color="neutral" variant="ghost" size="sm" label="Último mês" @click="atalho('mes')" />
      <UButton color="neutral" variant="ghost" size="sm" label="Acumulado do ano" @click="atalho('ano')" />
    </div>

    <UiExtraEstadoBloco v-if="q.error.value" :erro="q.error.value" @tentar-de-novo="q.refetch()" />
    <section
      v-else-if="r && !r.temDados"
      class="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center"
    >
      <UIcon name="i-lucide-banknote" class="size-8 text-muted-foreground" />
      <p class="font-medium">Nenhum faturamento importado ainda</p>
      <p class="text-sm text-muted-foreground">
        Importe o relatório diário de faturamento do Focco para ver a análise.
      </p>
      <UButton
        v-if="can('faturamento.import')"
        icon="i-lucide-file-up"
        label="Importar planilha"
        @click="importando = true"
      />
    </section>
    <template v-else>
      <section
        aria-label="Indicadores de faturamento"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <DashboardKpiCard
          v-for="c in CARDS"
          :key="c.k"
          :rotulo="c.rotulo"
          :icone="c.icone"
          :carregando="carregando"
          :valor="formatBRL(kpi(c.k)?.valor)"
          :variacoes="variacoes(c.k)"
          compacto
        />
      </section>

      <section class="space-y-4 lg:space-y-6">
        <div class="rounded-xl border bg-card p-5">
          <h3 class="text-sm font-medium text-muted-foreground">Fatura DRE mês a mês {{ r?.mensal.ano }}</h3>
          <div v-if="carregando" class="mt-4 h-72 animate-pulse rounded-lg bg-muted" />
          <ChartsBaseChart
            v-else-if="r"
            class="mt-2"
            altura="300px"
            rotulo="Fatura DRE mês a mês comparada ao ano anterior"
            :opcoes="(t) => evolucaoFaturamentoOptions(r!.mensal, t)"
          />
        </div>
        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-medium text-muted-foreground">Fatura DRE no período</h3>
            <UTabs v-model="visao" :items="ABAS" :content="false" size="xs" aria-label="Agrupar por" />
          </div>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-2">
              <USelect
                v-model="mesSel"
                :items="opcoesMesGrafico"
                size="sm"
                class="w-48"
                aria-label="Mês do gráfico"
              />
              <USelect
                v-if="visao === 'semana'"
                v-model="semanaSel"
                :items="opcoesSemana"
                size="sm"
                class="w-52"
                aria-label="Semana do gráfico"
              />
            </div>
            <span v-if="pontos.length" class="text-xs text-muted-foreground">
              Total: <b class="num text-foreground">{{ formatBRL(totalPontos) }}</b>
            </span>
          </div>
          <div v-if="carregando" class="mt-4 h-72 animate-pulse rounded-lg bg-muted" />
          <p v-else-if="!pontos.length" class="py-24 text-center text-sm text-muted-foreground">
            Sem faturamento no período.
          </p>
          <ChartsBaseChart
            v-else
            class="mt-2"
            :altura="alturaBarrasFaturamento(pontos.length)"
            :rotulo="`Fatura DRE ${visao === 'dia' ? 'por dia' : 'por semana'} no período`"
            :opcoes="(t) => barrasFaturamentoOptions(pontos, t)"
          />
        </div>
      </section>

      <section class="rounded-xl border bg-card" aria-labelledby="titulo-fat-mes">
        <div class="px-5 pt-5 pb-3">
          <h3 id="titulo-fat-mes" class="text-sm font-medium text-muted-foreground">Faturamento mês a mês</h3>
          <p v-if="r" class="text-xs text-muted-foreground">
            {{ periodoPorExtenso(`${r.mensal.ano}-01`, r.periodo.ate) }}
          </p>
        </div>
        <div v-if="carregando" class="space-y-2 px-5 pb-5">
          <div v-for="i in 6" :key="i" class="h-8 animate-pulse rounded bg-muted" />
        </div>
        <div v-else-if="r" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-xs text-muted-foreground">
              <tr>
                <th scope="col" class="px-5 py-2 text-left font-medium">Mês</th>
                <th
                  v-for="c in COLUNAS_TABELA"
                  :key="c.k"
                  scope="col"
                  class="px-5 py-2 text-right font-medium"
                >
                  {{ c.r }}
                </th>
                <th
                  scope="col"
                  class="bg-grafico-principal-forte px-5 py-2 text-right font-semibold text-foreground"
                >
                  Fatura DRE
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="m in r.mensal.meses" :key="m.mes" class="hover:bg-muted/30">
                <th scope="row" class="px-5 py-2 text-left font-medium">{{ MESES_EXTENSO[m.mes - 1] }}</th>
                <td
                  v-for="c in COLUNAS_TABELA"
                  :key="c.k"
                  class="num px-5 py-2 text-right"
                  :class="Number(m[c.k]) < 0 && 'text-danger'"
                >
                  {{ Number(m[c.k]) === 0 ? '—' : formatBRL(m[c.k]) }}
                </td>
                <td class="num bg-grafico-principal-soft px-5 py-2 text-right font-medium">
                  {{ formatBRL(m.dre) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-foreground/20 bg-muted text-base font-bold">
              <tr>
                <th scope="row" class="px-5 py-3 text-left uppercase tracking-wide">Total</th>
                <td
                  v-for="c in COLUNAS_TABELA"
                  :key="c.k"
                  class="num px-5 py-3 text-right"
                  :class="Number(r.mensal.total[c.k]) < 0 && 'text-danger'"
                >
                  {{ formatBRL(r.mensal.total[c.k]) }}
                </td>
                <td class="num bg-grafico-principal-forte px-5 py-3 text-right">
                  {{ formatBRL(r.mensal.total.dre) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </template>

    <FaturamentoImportarFaturamento v-model:aberto="importando" />
  </div>
</template>
