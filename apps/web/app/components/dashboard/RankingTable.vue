<script setup lang="ts">
import type { LinhaRanking } from '@meta-bi/shared';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-vue-next';

const props = defineProps<{
  linhas: LinhaRanking[];
  total: { total: string; qtd: number; ticket: string | null };
  rotuloColuna: string;
}>();

type Col = 'rotulo' | 'total' | 'qtd' | 'ticket' | 'participacao';
const ordem = ref<{ col: Col; dir: 1 | -1 }>({ col: 'total', dir: -1 });

const ordenadas = computed(() => {
  const { col, dir } = ordem.value;
  const val = (l: LinhaRanking) => (col === 'rotulo' ? l.rotulo : Number(l[col] ?? -Infinity));
  return [...props.linhas].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    return (typeof x === 'string' ? x.localeCompare(y as string, 'pt-BR') : x - (y as number)) * dir;
  });
});

function ordenar(col: Col) {
  ordem.value =
    ordem.value.col === col
      ? { col, dir: ordem.value.dir === 1 ? -1 : 1 }
      : { col, dir: col === 'rotulo' ? 1 : -1 };
}
const iconeOrdem = (col: Col) =>
  ordem.value.col !== col ? ArrowUpDown : ordem.value.dir === 1 ? ArrowUp : ArrowDown;
const ariaSort = (col: Col) =>
  ordem.value.col !== col ? 'none' : ordem.value.dir === 1 ? 'ascending' : 'descending';
const colunas: { col: Col; rotulo: string; num: boolean }[] = [
  { col: 'total', rotulo: 'Total', num: true },
  { col: 'qtd', rotulo: 'Pedidos', num: true },
  { col: 'ticket', rotulo: 'Ticket médio', num: true },
  { col: 'participacao', rotulo: '% Part.', num: true },
];
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <th class="w-10 px-4 py-3 text-left font-medium">#</th>
          <th class="px-3 py-3 text-left font-medium" :aria-sort="ariaSort('rotulo')">
            <button
              type="button"
              class="inline-flex items-center gap-1 hover:text-foreground"
              @click="ordenar('rotulo')"
            >
              {{ rotuloColuna }} <component :is="iconeOrdem('rotulo')" class="size-3" />
            </button>
          </th>
          <th
            v-for="c in colunas"
            :key="c.col"
            class="px-3 py-3 text-right font-medium"
            :aria-sort="ariaSort(c.col)"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1 hover:text-foreground"
              @click="ordenar(c.col)"
            >
              {{ c.rotulo }} <component :is="iconeOrdem(c.col)" class="size-3" />
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="(l, i) in ordenadas" :key="l.chave" class="hover:bg-muted/30">
          <td class="num px-4 py-2.5 text-muted-foreground">{{ i + 1 }}</td>
          <td class="px-3 py-2.5 font-medium">{{ l.rotulo }}</td>
          <td class="num px-3 py-2.5 text-right">{{ formatBRL(l.total) }}</td>
          <td class="num px-3 py-2.5 text-right">{{ formatInt(l.qtd) }}</td>
          <td class="num px-3 py-2.5 text-right">{{ formatBRL(l.ticket) }}</td>
          <td class="px-3 py-2.5 text-right">
            <div class="flex items-center justify-end gap-2">
              <div class="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: `${Math.round((l.participacao ?? 0) * 100)}%` }"
                />
              </div>
              <span class="num w-14">{{ formatPct(l.participacao) }}</span>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot class="border-t-2 font-semibold">
        <tr>
          <td class="px-4 py-3" />
          <td class="px-3 py-3">Total</td>
          <td class="num px-3 py-3 text-right">{{ formatBRL(total.total) }}</td>
          <td class="num px-3 py-3 text-right">{{ formatInt(total.qtd) }}</td>
          <td class="num px-3 py-3 text-right">{{ formatBRL(total.ticket) }}</td>
          <td class="num px-3 py-3 text-right">{{ linhas.length ? '100,0%' : '—' }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
