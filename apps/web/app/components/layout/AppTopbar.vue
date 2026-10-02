<script setup lang="ts">
import { CalendarDays, Menu, PanelLeft, Search } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

defineProps<{ titulo?: string }>();
const emit = defineEmits<{ 'alternar-sidebar': []; 'abrir-menu': [] }>();
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6"
  >
    <Button variant="ghost" size="icon" class="md:hidden" aria-label="Abrir menu" @click="emit('abrir-menu')">
      <Menu class="size-5" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="hidden md:inline-flex"
      aria-label="Recolher ou expandir menu lateral"
      @click="emit('alternar-sidebar')"
    >
      <PanelLeft class="size-5" />
    </Button>

    <h1 v-if="titulo" class="truncate text-base font-semibold md:text-lg">{{ titulo }}</h1>

    <div class="ml-auto flex items-center gap-1 md:gap-2">
      <!-- Período e busca global ganham comportamento na Fase 3 (filtros na URL). -->
      <Button
        variant="outline"
        size="sm"
        class="hidden gap-2 sm:inline-flex"
        disabled
        title="Disponível na Fase 3"
      >
        <CalendarDays class="size-4" /> Período
      </Button>
      <Button variant="ghost" size="icon" aria-label="Busca global (em breve)" disabled>
        <Search class="size-[18px]" />
      </Button>
      <LayoutThemeToggle />
      <LayoutUserMenu />
    </div>
  </header>
</template>
