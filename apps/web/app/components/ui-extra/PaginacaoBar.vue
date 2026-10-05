<script setup lang="ts">
/** Rodapé de tabela paginada. Ao mudar itens por página, quem usa volta para a página 1. */
const pagina = defineModel<number>('pagina', { required: true });
const porPagina = defineModel<number>('porPagina', { default: 25 });
const props = withDefaults(defineProps<{ total: number; rotulo?: string; opcoes?: number[] }>(), {
  rotulo: 'itens',
  opcoes: () => [25, 50, 100],
});

const inicio = computed(() => (props.total ? (pagina.value - 1) * porPagina.value + 1 : 0));
const fim = computed(() => Math.min(pagina.value * porPagina.value, props.total));
const itensPorPagina = computed(() => props.opcoes.map((n) => ({ label: `${n} por página`, value: n })));
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
    <span class="num text-muted-foreground">
      {{ formatInt(inicio) }}–{{ formatInt(fim) }} de {{ formatInt(total) }} {{ rotulo }}
    </span>
    <div class="flex flex-wrap items-center gap-2">
      <USelect
        v-model="porPagina"
        :items="itensPorPagina"
        size="sm"
        class="w-36"
        aria-label="Itens por página"
      />
      <UPagination
        v-model:page="pagina"
        :total="total"
        :items-per-page="porPagina"
        :sibling-count="1"
        size="sm"
        show-edges
      />
    </div>
  </div>
</template>
