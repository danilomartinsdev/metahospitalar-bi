<script setup lang="ts">
import { Toaster } from '~/components/ui/sonner';

// Aplica o tema salvo (classe .dark no <html>) desde a primeira renderização.
useTheme();
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
</template>
