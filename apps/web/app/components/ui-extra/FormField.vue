<script setup lang="ts">
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

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
      <Label :for="id">{{ label }}</Label>
      <slot name="acao" />
    </div>
    <Input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      class="h-10"
      :aria-invalid="erro ? 'true' : undefined"
      :aria-describedby="descricao"
    />
    <p v-if="erro" :id="`${id}-erro`" class="text-sm text-danger" role="alert">{{ erro }}</p>
    <p v-else-if="dica" :id="`${id}-dica`" class="text-xs text-muted-foreground">{{ dica }}</p>
  </div>
</template>
