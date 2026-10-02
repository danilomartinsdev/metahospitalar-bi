<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

const { isDark, toggle } = useTheme();
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="isDark ? 'Usar tema claro' : 'Usar tema escuro'"
    :title="isDark ? 'Tema claro' : 'Tema escuro'"
    @click="toggle"
  >
    <Sun v-if="isDark" class="size-[18px]" />
    <Moon v-else class="size-[18px]" />
  </Button>
</template>
