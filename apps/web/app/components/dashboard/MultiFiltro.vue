<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const props = defineProps<{
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  selecionados: string[];
}>();
const emit = defineEmits<{ alterar: [valores: string[]] }>();

function alternar(valor: string, marcado: boolean) {
  const s = new Set(props.selecionados);
  if (marcado) s.add(valor);
  else s.delete(valor);
  emit('alterar', [...s]);
}
const resumo = computed(() => {
  if (!props.selecionados.length) return props.rotulo;
  if (props.selecionados.length === 1) {
    return props.opcoes.find((o) => o.valor === props.selecionados[0])?.rotulo ?? props.rotulo;
  }
  return `${props.rotulo} (${props.selecionados.length})`;
});

// onSelect com preventDefault mantém o menu aberto para marcar várias opções.
const itens = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: props.rotulo }],
  props.opcoes.map((o) => ({
    type: 'checkbox' as const,
    label: o.rotulo,
    checked: props.selecionados.includes(o.valor),
    onUpdateChecked: (v: boolean) => alternar(o.valor, v),
    onSelect: (e: Event) => e.preventDefault(),
  })),
  ...(props.selecionados.length
    ? [[{ label: 'Limpar', icon: 'i-lucide-x', onSelect: () => emit('alterar', []) }]]
    : []),
]);
</script>

<template>
  <UDropdownMenu :items="itens" :content="{ align: 'start' }" :ui="{ content: 'max-h-80 w-60' }">
    <UButton
      :color="selecionados.length ? 'primary' : 'neutral'"
      variant="outline"
      size="sm"
      trailing-icon="i-lucide-chevron-down"
      :ui="{ label: 'max-w-36 truncate' }"
      :label="resumo"
    />
  </UDropdownMenu>
</template>
