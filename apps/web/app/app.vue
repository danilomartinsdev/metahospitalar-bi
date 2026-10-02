<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale';

// Aplica o tema salvo (classe .dark no <html>) desde a primeira renderização.
useTheme();
</script>

<template>
  <UApp :locale="pt_br" :toaster="{ position: 'top-right', duration: 4000 }">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
