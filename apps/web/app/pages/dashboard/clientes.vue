<script setup lang="ts">
import { Repeat, Sparkles, Users } from 'lucide-vue-next';
import { useClientesQuery } from '~/composables/api/useDashboard';

definePageMeta({ titulo: 'Clientes', permissao: 'dashboard.view' });
useHead({ title: 'Clientes — BI Meta Hospitalar' });

const { qs } = useFiltros();
const q = useClientesQuery(qs);
const filtro = ref<'todos' | 'novos' | 'recorrentes'>('todos');
const pagina = ref(1);
const POR_PAGINA = 25;

const lista = computed(() => {
  const r = q.data.value?.ranking ?? [];
  return filtro.value === 'novos'
    ? r.filter((c) => c.novo)
    : filtro.value === 'recorrentes'
      ? r.filter((c) => c.meses > 1)
      : r;
});
const visiveis = computed(() =>
  lista.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA),
);
const paginas = computed(() => Math.max(1, Math.ceil(lista.value.length / POR_PAGINA)));
watch([filtro, qs], () => (pagina.value = 1));
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <h2 class="text-2xl font-semibold">Clientes</h2>
    <DashboardFilterBar />

    <section class="grid gap-4 sm:grid-cols-3">
      <button
        v-for="c in [
          { k: 'todos', r: 'Clientes com compra', n: q.data.value?.total, i: Users },
          { k: 'novos', r: 'Clientes novos', n: q.data.value?.novos, i: Sparkles },
          { k: 'recorrentes', r: 'Compraram em mais de 1 mês', n: q.data.value?.recorrentes, i: Repeat },
        ] as const"
        :key="c.k"
        type="button"
        class="flex items-center justify-between rounded-xl border bg-card p-5 text-left transition-colors"
        :class="filtro === c.k ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'"
        :aria-pressed="filtro === c.k"
        @click="filtro = c.k"
      >
        <span>
          <span class="block text-sm text-muted-foreground">{{ c.r }}</span>
          <span class="num mt-1 block text-2xl font-semibold">{{
            q.isPending.value ? '…' : formatInt(c.n)
          }}</span>
        </span>
        <span class="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary"
          ><component :is="c.i" class="size-4"
        /></span>
      </button>
    </section>

    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="q.isPending.value"
        :erro="q.error.value"
        :vazio="!lista.length"
        texto-vazio="Nenhum cliente para os filtros escolhidos."
        @tentar-de-novo="q.refetch()"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th class="w-12 px-4 py-3 text-left font-medium">#</th>
                <th class="px-3 py-3 text-left font-medium">Cliente</th>
                <th class="px-3 py-3 text-right font-medium">Total</th>
                <th class="px-3 py-3 text-right font-medium">Pedidos</th>
                <th class="px-3 py-3 text-right font-medium">Meses c/ compra</th>
                <th class="px-3 py-3 text-right font-medium">% Part.</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(c, i) in visiveis" :key="c.chave">
                <td class="num px-4 py-2.5 text-muted-foreground">{{ (pagina - 1) * POR_PAGINA + i + 1 }}</td>
                <td class="px-3 py-2.5">
                  <span class="font-medium">{{ c.rotulo }}</span>
                  <UBadge v-if="c.novo" color="info" variant="soft" class="ml-2" label="novo" />
                </td>
                <td class="num px-3 py-2.5 text-right">{{ formatBRL(c.total) }}</td>
                <td class="num px-3 py-2.5 text-right">{{ formatInt(c.qtd) }}</td>
                <td class="num px-3 py-2.5 text-right">{{ formatInt(c.meses) }}</td>
                <td class="num px-3 py-2.5 text-right">{{ formatPct(c.participacao) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span class="text-muted-foreground">{{ formatInt(lista.length) }} clientes</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border px-3 py-1 disabled:opacity-40"
              :disabled="pagina === 1"
              @click="pagina--"
            >
              Anterior
            </button>
            <span class="num">{{ pagina }} / {{ paginas }}</span>
            <button
              type="button"
              class="rounded-md border px-3 py-1 disabled:opacity-40"
              :disabled="pagina >= paginas"
              @click="pagina++"
            >
              Próxima
            </button>
          </div>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
