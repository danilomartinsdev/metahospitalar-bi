<script setup lang="ts">
import type { DimensaoRanking } from '@meta-bi/shared';
import { useRankingQuery } from '~/composables/api/useDashboard';
import { barrasRankingOptions } from '~/utils/charts/options';

const props = defineProps<{ dim: DimensaoRanking }>();
const ABAS: { dim: DimensaoRanking; rotulo: string; coluna: string }[] = [
  { dim: 'gestores', rotulo: 'Representantes', coluna: 'Representante' },
  { dim: 'estados', rotulo: 'Estados', coluna: 'UF' },
  { dim: 'regioes', rotulo: 'Regiões', coluna: 'Região' },
];
const aba = computed(() => ABAS.find((a) => a.dim === props.dim)!);

const { qs } = useFiltros();
const route = useRoute();
const q = useRankingQuery(() => props.dim, qs);
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-2xl font-semibold">Ranking de {{ aba.rotulo.toLowerCase() }}</h2>
      <nav class="flex rounded-lg border bg-card p-1 text-sm" aria-label="Tipo de ranking">
        <NuxtLink
          v-for="a in ABAS"
          :key="a.dim"
          :to="{ path: `/dashboard/${a.dim}`, query: route.query }"
          class="rounded-md px-3 py-1.5"
          :class="
            a.dim === dim
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          :aria-current="a.dim === dim ? 'page' : undefined"
        >
          {{ a.rotulo }}
        </NuxtLink>
      </nav>
    </div>

    <DashboardFilterBar />

    <section class="rounded-xl border bg-card p-5">
      <div v-if="q.isPending.value" class="h-80 animate-pulse rounded-lg bg-muted" />
      <ChartsBaseChart
        v-else-if="q.data.value?.linhas.length"
        :altura="`${Math.min(10, q.data.value.linhas.length) * 34 + 30}px`"
        :rotulo="`Gráfico do ranking de ${aba.rotulo.toLowerCase()}`"
        :opcoes="(t) => barrasRankingOptions(q.data.value!.linhas, t)"
      />
    </section>

    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="q.isPending.value"
        :erro="q.error.value"
        :vazio="!q.data.value?.linhas.length"
        texto-vazio="Sem vendas para os filtros escolhidos."
        @tentar-de-novo="q.refetch()"
      >
        <DashboardRankingTable
          v-if="q.data.value"
          :linhas="q.data.value.linhas"
          :total="q.data.value.total"
          :rotulo-coluna="aba.coluna"
        />
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
