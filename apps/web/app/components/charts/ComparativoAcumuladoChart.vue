<script setup lang="ts">
import type { VisaoGeral } from '@meta-bi/shared';
import { buildComparativoAcumuladoOptions, categoriasAcumulado } from '~/utils/charts/comparativo-acumulado';

const props = defineProps<{
  acumulado?: VisaoGeral['acumuladoSegmento'];
  ano?: number;
  carregando?: boolean;
}>();

const cats = computed(() => (props.acumulado?.linhas.length ? categoriasAcumulado(props.acumulado) : []));
const classePct = (p: number | null) =>
  p === null ? 'text-muted-foreground' : p >= 0 ? 'text-success' : 'text-danger';
</script>

<template>
  <div v-if="carregando" class="mt-4 h-64 animate-pulse rounded-lg bg-muted" />
  <p v-else-if="!acumulado || !ano || !cats.length" class="py-20 text-center text-sm text-muted-foreground">
    Sem vendas no acumulado.
  </p>
  <template v-else>
    <ChartsBaseChart
      class="mt-2"
      altura="240px"
      :rotulo="`Acumulado de ${ano} comparado a ${ano - 1} por segmento: ${cats
        .map((c) => `${c.rotulo} ${formatBRL(c.atual)} contra ${formatBRL(c.anterior)}`)
        .join('; ')}`"
      :opcoes="(t) => buildComparativoAcumuladoOptions(acumulado!, ano!, t)"
    />
    <table class="mt-3 w-full text-xs">
      <caption class="sr-only">
        Acumulado por segmento
      </caption>
      <thead class="sr-only">
        <tr>
          <th>Segmento</th>
          <th>{{ ano }} e {{ ano - 1 }}</th>
          <th>Variação</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="c in cats" :key="c.segmento" :class="c.segmento === 'TOTAL' && 'font-semibold'">
          <th scope="row" class="py-1.5 pr-2 text-left align-top font-medium">{{ c.rotulo }}</th>
          <td class="num py-1.5 text-right">
            {{ formatBRL(c.atual) }}
            <span class="block font-normal text-muted-foreground">{{ ano - 1 }}: {{ formatBRL(c.anterior) }}</span>
          </td>
          <td class="num w-16 py-1.5 pl-2 text-right align-top" :class="classePct(c.pct)">
            {{ c.pct === null ? 'sem base' : formatPct(c.pct) }}
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
