<script setup lang="ts">
import { DollarSign, Landmark, Receipt, ShoppingCart } from 'lucide-vue-next';
import { useMesesQuery, useVisaoGeralQuery } from '~/composables/api/useDashboard';
import { barrasRankingOptions, donutOptions, evolucaoOptions } from '~/utils/charts/options';

definePageMeta({ titulo: 'Visão geral', permissao: 'dashboard.view' });
useHead({ title: 'Visão geral — BI Meta Hospitalar' });

const { qs, filtros } = useFiltros();
const meses = useMesesQuery();
const q = useVisaoGeralQuery(qs);
const v = computed(() => q.data.value);
const carregando = computed(() => q.isPending.value);
const donut = ref<'regiao' | 'segmento'>('regiao');
const can = useCan();

const NOMES_MES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const rotuloPeriodo = computed(() => {
  const p = v.value?.periodo;
  if (!p) return '';
  const f = (m: string) => `${NOMES_MES[Number(m.slice(5)) - 1]} de ${m.slice(0, 4)}`;
  return p.de === p.ate ? f(p.de) : `${f(p.de)} a ${f(p.ate)}`;
});
/** Último mês com pedidos importados (no escopo do usuário). */
const dadosAte = computed(() => {
  const m = meses.data.value?.at(-1);
  return m ? `${NOMES_MES[Number(m.slice(5)) - 1]} de ${m.slice(0, 4)}` : '';
});
const MES_CURTO = (n: number) => NOMES_MES[n - 1]!.slice(0, 3);
const serie = (k: 'total' | 'qtd' | 'ticket') => v.value?.kpis[k].serie.map((s) => Number(s.valor)) ?? [];
const variacoes = (k: 'total' | 'qtd' | 'ticket') =>
  v.value
    ? [
        { rotulo: 'vs. período anterior', pct: v.value.kpis[k].mesAnterior.pct },
        { rotulo: 'vs. ano anterior', pct: v.value.kpis[k].anoAnterior.pct },
      ]
    : [];
const ABAS_DONUT = [
  { label: 'Região', value: 'regiao' },
  { label: 'Público × Privado', value: 'segmento' },
];
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">Visão geral</h2>
        <p class="text-sm text-muted-foreground">
          {{ rotuloPeriodo || 'Carregando período…' }}
          <template v-if="dadosAte"> · dados importados até {{ dadosAte }}</template>
        </p>
      </div>
      <DashboardExportarMenu />
    </div>

    <DashboardFilterBar :periodo="v?.periodo" />

    <UAlert
      v-if="filtros.q"
      color="warning"
      variant="subtle"
      icon="i-lucide-search"
      :title="`Busca ativa: “${filtros.q}”`"
      description="Indicadores, gráficos e rankings consideram só os pedidos encontrados pela busca."
    />

    <UiExtraEstadoBloco v-if="q.error.value" :erro="q.error.value" @tentar-de-novo="q.refetch()" />
    <template v-else>
      <section aria-label="Indicadores" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          rotulo="Total vendido"
          :icone="DollarSign"
          :carregando="carregando"
          :valor="formatBRL(v?.kpis.total.valor)"
          :variacoes="variacoes('total')"
          :serie="serie('total')"
        />
        <DashboardKpiCard
          rotulo="Pedidos"
          :icone="ShoppingCart"
          :carregando="carregando"
          :valor="formatInt(v?.kpis.qtd.valor)"
          :variacoes="variacoes('qtd')"
          :serie="serie('qtd')"
        />
        <DashboardKpiCard
          rotulo="Ticket médio"
          :icone="Receipt"
          :carregando="carregando"
          :valor="formatBRL(v?.kpis.ticket.valor)"
          :variacoes="variacoes('ticket')"
          :serie="serie('ticket')"
        />
        <DashboardKpiCard
          rotulo="% Público"
          :icone="Landmark"
          :carregando="carregando"
          :valor="formatPct(v?.kpis.pctPublico.valor)"
          :serie="v?.kpis.pctPublico.serie.map((s) => s.valor)"
          :variacoes="
            v ? [{ rotulo: `no ano anterior: ${formatPct(v.kpis.pctPublico.anoAnterior)}`, pct: null }] : []
          "
        />
      </section>

      <section v-if="v" aria-label="Abrangência" class="flex flex-wrap gap-2">
        <span
          v-for="c in [
            { n: v.contagens.estados, r: 'estados' },
            { n: v.contagens.regioes, r: 'regiões' },
            { n: v.contagens.gestores, r: 'representantes' },
            { n: v.contagens.clientes, r: 'clientes' },
          ]"
          :key="c.r"
          class="inline-flex gap-1 rounded-full border bg-card px-3 py-1 text-sm"
        >
          <span class="num font-semibold">{{ formatInt(c.n) }}</span>
          <span class="text-muted-foreground">{{ c.r }}</span>
        </span>
      </section>

      <section class="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div class="rounded-xl border bg-card p-5 lg:col-span-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Evolução mensal {{ v?.evolucao.ano }} — real × ano anterior{{
              v?.evolucao.meses.some((m) => m.meta) ? ' × meta' : ''
            }}
          </h3>
          <div v-if="carregando" class="mt-4 h-72 animate-pulse rounded-lg bg-muted" />
          <ChartsBaseChart
            v-else-if="v"
            class="mt-2"
            altura="300px"
            rotulo="Gráfico de evolução mensal de vendas comparando com o ano anterior e a meta"
            :opcoes="(t) => evolucaoOptions(v!.evolucao, t)"
          />
          <p v-if="v" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <template v-if="v.evolucao.atingimento">
              <span>
                Meta acumulada
                {{
                  v.evolucao.atingimento.mesInicial === v.evolucao.atingimento.mesFinal
                    ? MES_CURTO(v.evolucao.atingimento.mesFinal)
                    : `${MES_CURTO(v.evolucao.atingimento.mesInicial)}–${MES_CURTO(v.evolucao.atingimento.mesFinal)}`
                }}:
                <b class="num text-foreground">{{ formatBRL(v.evolucao.atingimento.meta) }}</b>
              </span>
              <span>
                Realizado: <b class="num text-foreground">{{ formatBRL(v.evolucao.atingimento.real) }}</b>
              </span>
              <span>
                Atingimento:
                <b
                  class="num"
                  :class="(v.evolucao.atingimento.pct ?? 0) >= 1 ? 'text-success' : 'text-warning'"
                  >{{ formatPct(v.evolucao.atingimento.pct) }}</b
                >
              </span>
            </template>
            <span v-else>
              Sem meta para o período.
              <NuxtLink v-if="can('metas.edit')" to="/admin/metas" class="font-medium text-primary hover:underline">
                Definir metas
              </NuxtLink>
            </span>
          </p>
        </div>
        <div class="rounded-xl border bg-card p-5">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">Participação</h3>
            <UTabs
              v-model="donut"
              :items="ABAS_DONUT"
              :content="false"
              size="xs"
              aria-label="Agrupar participação por"
            />
          </div>
          <div v-if="carregando" class="mx-auto mt-6 size-48 animate-pulse rounded-full bg-muted" />
          <p v-else-if="v && !v.porRegiao.length" class="py-20 text-center text-sm text-muted-foreground">
            Sem vendas no período.
          </p>
          <ChartsBaseChart
            v-else-if="v"
            altura="300px"
            :rotulo="`Participação das vendas por ${donut === 'regiao' ? 'região' : 'segmento'}`"
            :opcoes="(t) => donutOptions(donut === 'regiao' ? v!.porRegiao : v!.porSegmento, t)"
          />
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div class="rounded-xl border bg-card p-5 lg:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">Top 10 representantes</h3>
            <NuxtLink
              :to="{ path: '/dashboard/gestores', query: $route.query }"
              class="text-xs font-medium text-primary hover:underline"
            >
              Ver ranking completo
            </NuxtLink>
          </div>
          <div v-if="carregando" class="mt-4 h-72 animate-pulse rounded-lg bg-muted" />
          <p v-else-if="v && !v.topGestores.length" class="py-20 text-center text-sm text-muted-foreground">
            Sem vendas no período.
          </p>
          <ChartsBaseChart
            v-else-if="v"
            altura="320px"
            rotulo="Ranking dos 10 representantes com maior volume de vendas"
            :opcoes="(t) => barrasRankingOptions(v!.topGestores, t)"
          />
        </div>
        <div class="rounded-xl border bg-card p-5">
          <h3 class="text-sm font-medium text-muted-foreground">
            Acumulado do ano por segmento
            <span v-if="v" class="block text-xs font-normal"
              >jan–{{ NOMES_MES[v.acumuladoSegmento.meses - 1]?.slice(0, 3) }} {{ v.evolucao.ano }} vs. mesmo
              período de {{ v.evolucao.ano - 1 }}</span
            >
          </h3>
          <ChartsComparativoAcumuladoChart
            :acumulado="v?.acumuladoSegmento"
            :ano="v?.evolucao.ano"
            :carregando="carregando"
          />
        </div>
      </section>
    </template>
  </div>
</template>
