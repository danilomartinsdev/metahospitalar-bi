<script setup lang="ts">
import { sparklineOptions } from '~/utils/charts/options';

const props = defineProps<{
  rotulo: string;
  valor: string;
  /** Nome do ícone (i-lucide-*). */
  icone: string;
  variacoes?: { rotulo: string; pct: number | null }[];
  serie?: (number | null)[];
  carregando?: boolean;
  /** Valor menor e sem quebra de linha (telas com muitos cards lado a lado). */
  compacto?: boolean;
}>();

const classeVar = (p: number | null) =>
  p === null || Math.abs(p) < 0.0005 ? 'text-muted-foreground' : p > 0 ? 'text-success' : 'text-danger';
const iconeVar = (p: number | null) =>
  p === null || Math.abs(p) < 0.0005
    ? 'i-lucide-minus'
    : p > 0
      ? 'i-lucide-arrow-up-right'
      : 'i-lucide-arrow-down-right';
const temSerie = computed(() => (props.serie?.filter((v) => v !== null).length ?? 0) > 1);
</script>

<template>
  <div class="flex flex-col rounded-xl border bg-card p-5">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-muted-foreground">{{ rotulo }}</span>
      <span class="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
        <UIcon :name="icone" class="size-4" aria-hidden="true" />
      </span>
    </div>
    <template v-if="carregando">
      <div class="mt-4 h-8 w-3/4 animate-pulse rounded-md bg-muted" />
      <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
    </template>
    <template v-else>
      <p
        class="num mt-3 font-semibold leading-tight"
        :class="compacto ? 'whitespace-nowrap text-lg 2xl:text-xl' : 'break-words text-2xl 2xl:text-[26px]'"
      >
        {{ valor }}
      </p>
      <ul v-if="variacoes?.length" class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <li v-for="v in variacoes" :key="v.rotulo" class="flex items-center gap-1" :class="classeVar(v.pct)">
          <template v-if="v.pct !== null">
            <UIcon :name="iconeVar(v.pct)" class="size-3.5" aria-hidden="true" />
            <span class="num font-medium">{{ formatPct(v.pct) }}</span>
          </template>
          <span v-else class="font-medium">sem base</span>
          <span class="text-muted-foreground">{{ v.rotulo }}</span>
        </li>
      </ul>
      <ChartsBaseChart
        v-if="temSerie"
        class="mt-3"
        altura="40px"
        :rotulo="`Tendência de ${rotulo} nos últimos 12 meses`"
        :opcoes="(t) => sparklineOptions(serie!, t)"
      />
    </template>
  </div>
</template>
