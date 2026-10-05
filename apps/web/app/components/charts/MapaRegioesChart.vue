<script setup lang="ts">
import type { LinhaRanking } from '@meta-bi/shared';
import { registerMap } from 'echarts/core';
import { buildMapaRegioesOptions, MAPA_REGIOES, REGIOES_MAPA } from '~/utils/charts/mapa-regioes';

const props = defineProps<{ linhas?: LinhaRanking[]; carregando?: boolean; altura?: string }>();

// A malha (IBGE, ~28 KB) é carregada e registrada uma única vez por sessão.
let carga: Promise<void> | null = null;
function carregarMalha() {
  carga ??= $fetch<Parameters<typeof registerMap>[1]>('/geo/br-regioes.json').then((geo) =>
    registerMap(MAPA_REGIOES, geo),
  );
  return carga;
}
const pronto = ref(false);
const falhou = ref(false);
onMounted(() =>
  carregarMalha()
    .then(() => (pronto.value = true))
    .catch(() => {
      carga = null;
      falhou.value = true;
    }),
);

const { filtros, definir } = useFiltros();
const selecionadas = computed(() => filtros.value.regiao);

/** Clique numa região liga/desliga o filtro dela (soma às já selecionadas). */
function alternar(p: { name?: string }) {
  const r = p.name;
  if (!r || !(REGIOES_MAPA as readonly string[]).includes(r)) return;
  const atual = selecionadas.value as string[];
  definir({ regiao: atual.includes(r) ? atual.filter((x) => x !== r) : [...atual, r] });
}

const exterior = computed(() => props.linhas?.find((l) => l.chave === 'EXTERIOR'));
const resumo = computed(() =>
  (props.linhas ?? [])
    .filter((l) => l.chave !== 'EXTERIOR')
    .map((l) => `${l.rotulo} ${formatPct(l.participacao)}`)
    .join(', '),
);
</script>

<template>
  <div
    v-if="carregando || (!pronto && !falhou)"
    class="mx-auto mt-6 h-64 w-56 animate-pulse rounded-3xl bg-muted"
  />
  <p v-else-if="falhou" class="py-20 text-center text-sm text-muted-foreground">
    Não foi possível carregar o mapa.
  </p>
  <template v-else>
    <ChartsBaseChart
      :altura="altura ?? '300px'"
      class="cursor-pointer"
      :rotulo="`Mapa de vendas por região${resumo ? `: ${resumo}` : ''}. Clique numa região para filtrar.`"
      :opcoes="(t) => buildMapaRegioesOptions(linhas ?? [], selecionadas, t)"
      @clique="alternar"
    />
    <p class="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
      <span>{{
        selecionadas.length ? 'Clique de novo para tirar do filtro.' : 'Clique numa região para filtrar.'
      }}</span>
      <span v-if="exterior"
        >Exterior: {{ formatBRL(exterior.total) }} ({{ formatPct(exterior.participacao) }})</span
      >
    </p>
  </template>
</template>
