<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale';
import { Toaster } from '~/components/ui/sonner';

// Aplica o tema salvo (classe .dark no <html>) desde a primeira renderização.
useTheme();
</script>

<template>
  <UApp :locale="pt_br">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors position="top-right" />
  </UApp>
</template>
