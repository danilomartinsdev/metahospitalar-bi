<script setup lang="ts">
import { Construction } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { NAV } from '~/components/layout/nav';

const route = useRoute();
const item = computed(() => NAV.flatMap((g) => g.itens).find((i) => route.path.startsWith(i.to) && i.fase));
definePageMeta({ titulo: '' });
useHead({ title: () => `${item.value?.label ?? 'Página não encontrada'} — BI Meta Hospitalar` });
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
    <Construction class="size-12 text-muted-foreground" aria-hidden="true" />
    <template v-if="item">
      <h2 class="text-xl font-semibold">{{ item.label }}</h2>
      <p class="text-sm text-muted-foreground">Esta tela será entregue na Fase {{ item.fase }}.</p>
    </template>
    <template v-else>
      <h2 class="text-xl font-semibold">Página não encontrada</h2>
      <p class="text-sm text-muted-foreground">O endereço não existe ou foi movido.</p>
    </template>
    <Button as-child variant="outline"><NuxtLink to="/dashboard">Voltar à visão geral</NuxtLink></Button>
  </div>
</template>
