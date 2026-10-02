<script setup lang="ts">
import { AlertCircle, Inbox } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

defineProps<{
  carregando?: boolean;
  erro?: unknown;
  vazio?: boolean;
  textoVazio?: string;
  linhas?: number;
}>();
const emit = defineEmits<{ tentarDeNovo: [] }>();
</script>

<template>
  <div v-if="carregando" class="space-y-3 p-5" aria-busy="true" aria-label="Carregando">
    <div v-for="i in linhas ?? 5" :key="i" class="h-9 animate-pulse rounded-md bg-muted" />
  </div>
  <div v-else-if="erro" class="flex flex-col items-center gap-3 p-10 text-center" role="alert">
    <AlertCircle class="size-8 text-danger" aria-hidden="true" />
    <p class="text-sm">Não foi possível carregar os dados.</p>
    <Button variant="outline" size="sm" @click="emit('tentarDeNovo')">Tentar de novo</Button>
  </div>
  <div v-else-if="vazio" class="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
    <Inbox class="size-8" aria-hidden="true" />
    <p class="text-sm">{{ textoVazio ?? 'Nada por aqui ainda.' }}</p>
  </div>
  <slot v-else />
</template>
