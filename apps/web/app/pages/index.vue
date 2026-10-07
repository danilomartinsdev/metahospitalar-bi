<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { paginaInicial } from '~/utils/navegacao';

await navigateTo(paginaInicial(useAuthStore().usuario), { replace: true });
</script>

<template>
  <div />
</template>
