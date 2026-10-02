<script setup lang="ts">
/**
 * Campo de texto dentro de um <UForm>: o erro vem do schema pelo `name` e é anunciado
 * com role="alert" (o UFormField puro não anuncia).
 */
defineOptions({ inheritAttrs: false });
defineProps<{ name: string; label: string; dica?: string }>();
const model = defineModel<string>();
</script>

<template>
  <UFormField :name="name" :label="label" :description="dica" :ui="{ error: 'text-sm' }">
    <template v-if="$slots.acao" #hint><slot name="acao" /></template>
    <UInput v-model="model" v-bind="$attrs" size="lg" class="w-full" :ui="{ base: 'h-10' }" />
    <template #error="{ error }">
      <span v-if="error" role="alert">{{ error }}</span>
    </template>
  </UFormField>
</template>
