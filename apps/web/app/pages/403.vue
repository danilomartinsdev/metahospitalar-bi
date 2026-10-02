<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

definePageMeta({ titulo: 'Acesso negado' });
useHead({ title: 'Acesso negado — BI Meta Hospitalar' });
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
    <ShieldAlert class="size-12 text-warning" aria-hidden="true" />
    <h2 class="text-xl font-semibold">Você não tem acesso a esta página</h2>
    <p class="text-sm text-muted-foreground">
      Se precisar dela, peça ao administrador para ajustar seu perfil.
    </p>
    <Button as-child><NuxtLink to="/dashboard">Voltar à visão geral</NuxtLink></Button>
  </div>
</template>
