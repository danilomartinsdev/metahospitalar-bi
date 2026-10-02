<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

const props = defineProps<{
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  selecionados: string[];
}>();
const emit = defineEmits<{ alterar: [valores: string[]] }>();

function alternar(valor: string, marcado: boolean | 'indeterminate') {
  const s = new Set(props.selecionados);
  if (marcado === true) s.add(valor);
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
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" :class="selecionados.length ? 'border-primary text-primary' : ''">
        <span class="max-w-36 truncate">{{ resumo }}</span>
        <ChevronDown class="opacity-60" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="max-h-80 w-60 overflow-y-auto">
      <DropdownMenuLabel>{{ rotulo }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="o in opcoes"
        :key="o.valor"
        :model-value="selecionados.includes(o.valor)"
        @select.prevent
        @update:model-value="(v: boolean | 'indeterminate') => alternar(o.valor, v)"
      >
        {{ o.rotulo }}
      </DropdownMenuCheckboxItem>
      <template v-if="selecionados.length">
        <DropdownMenuSeparator />
        <button
          type="button"
          class="w-full px-2 py-1.5 text-left text-sm text-primary hover:underline"
          @click="emit('alterar', [])"
        >
          Limpar
        </button>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
