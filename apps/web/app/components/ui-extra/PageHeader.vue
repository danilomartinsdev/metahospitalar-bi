<script setup lang="ts">
defineProps<{ titulo: string; descricao?: string }>();
const route = useRoute();
/** Seção acima do título (as telas de /admin ganham "Administração"). */
const secao = computed(() => (route.path.startsWith('/admin') ? 'Administração' : undefined));
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p v-if="secao" class="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {{ secao }}
      </p>
      <h2 class="text-2xl font-semibold">{{ titulo }}</h2>
      <p v-if="descricao" class="mt-1 text-sm text-muted-foreground">{{ descricao }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot /></div>
  </div>
</template>
