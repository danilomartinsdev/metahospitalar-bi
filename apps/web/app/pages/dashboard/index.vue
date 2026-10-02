<script setup lang="ts">
import { DollarSign, Landmark, Receipt, ShoppingCart } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ titulo: 'Visão geral', permissao: 'dashboard.view' });
useHead({ title: 'Visão geral — BI Meta Hospitalar' });

const auth = useAuthStore();
const primeiroNome = computed(() => auth.usuario?.nome.split(' ')[0] ?? '');

// Placeholders: os KPIs reais chegam na Fase 3 (docs/dados/metricas-kpis.md).
const kpis = [
  { rotulo: 'Total vendido', icone: DollarSign },
  { rotulo: 'Pedidos', icone: ShoppingCart },
  { rotulo: 'Ticket médio', icone: Receipt },
  { rotulo: '% Público', icone: Landmark },
];
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div>
      <h2 class="text-2xl font-semibold">Olá, {{ primeiroNome }}</h2>
      <p class="text-sm text-muted-foreground">Acompanhe as vendas da Meta Hospitalar.</p>
    </div>

    <section aria-label="Indicadores" class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      <div v-for="k in kpis" :key="k.rotulo" class="rounded-xl border bg-card p-5">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">{{ k.rotulo }}</span>
          <span class="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
            <component :is="k.icone" class="size-4" aria-hidden="true" />
          </span>
        </div>
        <div class="mt-4 h-8 w-3/4 animate-pulse rounded-md bg-muted" />
        <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <div class="rounded-xl border bg-card p-5 lg:col-span-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Evolução mensal — Real × Ano anterior × Meta
        </h3>
        <div class="mt-4 h-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div class="rounded-xl border bg-card p-5">
        <h3 class="text-sm font-medium text-muted-foreground">Por região</h3>
        <div class="mx-auto mt-6 size-44 animate-pulse rounded-full bg-muted" />
      </div>
    </section>

    <div class="rounded-xl border border-dashed bg-card p-6 text-center">
      <p class="font-medium">Ainda não há dados para exibir</p>
      <p class="mt-1 text-sm text-muted-foreground">
        A importação do relatório Focco chega na Fase 2 e os indicadores na Fase 3.
      </p>
    </div>
  </div>
</template>
