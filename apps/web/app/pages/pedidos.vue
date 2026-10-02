<script setup lang="ts">
import { ArrowDown, ArrowUp, Columns3 } from 'lucide-vue-next';
import { useLocalStorage } from '@vueuse/core';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { usePedidosQuery } from '~/composables/api/useDashboard';

definePageMeta({ titulo: 'Pedidos', permissao: 'pedidos.view' });
useHead({ title: 'Pedidos — BI Meta Hospitalar' });

const route = useRoute();
const router = useRouter();
const { query } = useFiltros();

type Ordem = 'dtEmissao' | 'valor' | 'numPedido' | 'cliente' | 'uf' | 'representante';
const page = computed(() => Number(route.query.page ?? 1) || 1);
const pageSize = computed(() => Number(route.query.pageSize ?? 25) || 25);
const sort = computed(() => (route.query.sort as Ordem) ?? 'dtEmissao');
const dir = computed(() => (route.query.dir === 'asc' ? 'asc' : 'desc'));
const qs = computed(() =>
  new URLSearchParams({
    ...query.value,
    page: String(page.value),
    pageSize: String(pageSize.value),
    sort: sort.value,
    dir: dir.value,
  }).toString(),
);
const q = usePedidosQuery(qs);

function navegar(p: Record<string, string | number>) {
  void router.replace({
    query: { ...route.query, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) },
  });
}
function ordenar(col: Ordem) {
  navegar({ sort: col, dir: sort.value === col && dir.value === 'desc' ? 'asc' : 'desc', page: 1 });
}
// Filtros mudaram → volta para a página 1.
watch(
  () => JSON.stringify(query.value),
  () => page.value !== 1 && navegar({ page: 1 }),
);

const COLUNAS = [
  { k: 'numPedido', r: 'Nº pedido', ordem: 'numPedido' },
  { k: 'dtEmissao', r: 'Emissão', ordem: 'dtEmissao' },
  { k: 'dtEntrega', r: 'Entrega' },
  { k: 'status', r: 'Status' },
  { k: 'cliente', r: 'Cliente', ordem: 'cliente' },
  { k: 'uf', r: 'UF', ordem: 'uf' },
  { k: 'gestor', r: 'Gestor', ordem: 'representante' },
  { k: 'segmento', r: 'Segmento' },
  { k: 'ordemCpr', r: 'Ordem CPR' },
  { k: 'valor', r: 'Valor', ordem: 'valor', num: true },
] as const;
const visiveis = useLocalStorage<string[]>('meta-bi-colunas-pedidos', [
  'numPedido',
  'dtEmissao',
  'status',
  'cliente',
  'uf',
  'gestor',
  'valor',
]);
const colunas = computed(() => COLUNAS.filter((c) => visiveis.value.includes(c.k)));
function alternarColuna(k: string, v: boolean | 'indeterminate') {
  visiveis.value = v === true ? [...visiveis.value, k] : visiveis.value.filter((x) => x !== k);
}

const COR: Record<string, string> = {
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  highlight: 'bg-highlight/15 text-highlight',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};
const total = computed(() => q.data.value?.meta.total ?? 0);
const paginas = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-2xl font-semibold">Pedidos</h2>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm"><Columns3 /> Colunas</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="c in COLUNAS"
            :key="c.k"
            :model-value="visiveis.includes(c.k)"
            @select.prevent
            @update:model-value="(v: boolean | 'indeterminate') => alternarColuna(c.k, v)"
          >
            {{ c.r }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <DashboardFilterBar :periodo="q.data.value?.periodo" />

    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="q.isPending.value"
        :erro="q.error.value"
        :vazio="!q.data.value?.data.length"
        texto-vazio="Nenhum pedido para os filtros escolhidos."
        :linhas="8"
        @tentar-de-novo="q.refetch()"
      >
        <div class="overflow-x-auto" :class="q.isFetching.value && 'opacity-60 transition-opacity'">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th
                  v-for="c in colunas"
                  :key="c.k"
                  class="whitespace-nowrap px-3 py-3 font-medium first:pl-5 last:pr-5"
                  :class="'num' in c ? 'text-right' : 'text-left'"
                  :aria-sort="
                    'ordem' in c && sort === c.ordem
                      ? dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  "
                >
                  <button
                    v-if="'ordem' in c"
                    type="button"
                    class="inline-flex items-center gap-1 hover:text-foreground"
                    @click="ordenar(c.ordem)"
                  >
                    {{ c.r }}
                    <component
                      :is="dir === 'asc' ? ArrowUp : ArrowDown"
                      v-if="sort === c.ordem"
                      class="size-3"
                    />
                  </button>
                  <template v-else>{{ c.r }}</template>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="p in q.data.value?.data" :key="p.id" class="hover:bg-muted/30">
                <td
                  v-for="c in colunas"
                  :key="c.k"
                  class="px-3 py-2.5 first:pl-5 last:pr-5"
                  :class="'num' in c && 'num text-right'"
                >
                  <template v-if="c.k === 'status'">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-semibold"
                      :class="COR[p.status.cor] ?? COR.muted"
                      :title="p.status.descricao"
                    >
                      {{ p.status.codigo }}
                    </span>
                  </template>
                  <template v-else-if="c.k === 'valor'">{{ formatBRL(p.valor) }}</template>
                  <template v-else-if="c.k === 'dtEmissao' || c.k === 'dtEntrega'">
                    <span class="num whitespace-nowrap">{{ formatDate(p[c.k]) }}</span>
                  </template>
                  <template v-else-if="c.k === 'cliente'"
                    ><span class="block max-w-72 truncate" :title="p.cliente">{{ p.cliente }}</span></template
                  >
                  <template v-else>{{ p[c.k] ?? '—' }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <span class="text-muted-foreground">
            <span class="num">{{ formatInt(total) }}</span> pedidos
          </span>
          <div class="flex items-center gap-2">
            <select
              class="h-8 rounded-md border bg-background px-2"
              :value="pageSize"
              aria-label="Itens por página"
              @change="navegar({ pageSize: ($event.target as HTMLSelectElement).value, page: 1 })"
            >
              <option v-for="n in [25, 50, 100]" :key="n" :value="n">{{ n }} por página</option>
            </select>
            <button
              type="button"
              class="rounded-md border px-3 py-1 disabled:opacity-40"
              :disabled="page <= 1"
              @click="navegar({ page: page - 1 })"
            >
              Anterior
            </button>
            <span class="num">{{ page }} / {{ paginas }}</span>
            <button
              type="button"
              class="rounded-md border px-3 py-1 disabled:opacity-40"
              :disabled="page >= paginas"
              @click="navegar({ page: page + 1 })"
            >
              Próxima
            </button>
          </div>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
