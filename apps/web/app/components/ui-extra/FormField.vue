<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; erro?: string; dica?: string }>();
const model = defineModel<string>();
const descricao = computed(() =>
  props.erro ? `${props.id}-erro` : props.dica ? `${props.id}-dica` : undefined,
);
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
      <slot name="acao" />
    </div>
    <UInput
      :id="id"
      v-model="model"
      v-bind="$attrs"
      size="lg"
      class="w-full"
      :ui="{ base: 'h-10' }"
      :color="erro ? 'error' : undefined"
      :highlight="!!erro"
      :aria-invalid="erro ? 'true' : undefined"
      :aria-describedby="descricao"
    />
    <p v-if="erro" :id="`${id}-erro`" class="text-sm text-danger" role="alert">{{ erro }}</p>
    <p v-else-if="dica" :id="`${id}-dica`" class="text-xs text-muted-foreground">{{ dica }}</p>
  </div>
</template>
