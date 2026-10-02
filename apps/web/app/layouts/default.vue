<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet';

const recolhida = useLocalStorage('meta-bi-sidebar-recolhida', false);
const menuMobile = ref(false);
const route = useRoute();
const titulo = computed(() => route.meta.titulo as string | undefined);
</script>

<template>
  <div class="flex min-h-dvh">
    <aside
      class="sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border transition-[width] duration-200 md:block"
      :class="recolhida ? 'w-[72px]' : 'w-64'"
    >
      <LayoutAppSidebar :recolhida="recolhida" />
    </aside>

    <Sheet v-model:open="menuMobile">
      <SheetContent side="left" class="w-72 border-0 p-0">
        <SheetTitle class="sr-only">Menu</SheetTitle>
        <LayoutAppSidebar @navegou="menuMobile = false" />
      </SheetContent>
    </Sheet>

    <div class="flex min-w-0 flex-1 flex-col">
      <LayoutAppTopbar
        :titulo="titulo"
        @alternar-sidebar="recolhida = !recolhida"
        @abrir-menu="menuMobile = true"
      />
      <main id="conteudo" class="flex-1 px-4 py-6 md:px-8 md:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
