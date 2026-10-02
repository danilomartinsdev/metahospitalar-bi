<script setup lang="ts">
import { REGIAO_ENUM_ROTULO, REGIOES_ENUM, UFS } from '@meta-bi/shared';
import { useDebounceFn } from '@vueuse/core';
import { CalendarDays } from 'lucide-vue-next';
import { useRepresentantesQuery, useStatusQuery } from '~/composables/api/useCadastros';
import { useMesesQuery } from '~/composables/api/useDashboard';

/** Período exibido quando a URL não define um (vem da API: início do ano até o último mês com dados). */
const props = defineProps<{ periodo?: { de: string; ate: string }; semPeriodo?: boolean }>();

const { filtros, ativos, definir, limpar } = useFiltros();
const meses = useMesesQuery();
const reps = useRepresentantesQuery();
const status = useStatusQuery();

const NOMES_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = (m: string) => `${NOMES_MES[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`;
const opcoesMes = computed(() => [...(meses.data.value ?? [])].reverse());
const de = computed(() => filtros.value.de ?? props.periodo?.de ?? '');
const ate = computed(() => filtros.value.ate ?? props.periodo?.ate ?? '');

function mudarPeriodo(campo: 'de' | 'ate', valor: string) {
  const novo = { de: de.value, ate: ate.value, [campo]: valor };
  if (novo.de > novo.ate) {
    if (campo === 'de') novo.ate = novo.de;
    else novo.de = novo.ate;
  }
  definir(novo);
}

function atalho(tipo: 'mes' | 'ano') {
  const ultimo = meses.data.value?.at(-1);
  if (!ultimo) return;
  definir(tipo === 'mes' ? { de: ultimo, ate: ultimo } : { de: `${ultimo.slice(0, 4)}-01`, ate: ultimo });
}

const busca = ref(filtros.value.q ?? '');
watch(
  () => filtros.value.q,
  (q) => (busca.value = q ?? ''),
);
const buscar = useDebounceFn((v: string) => definir({ q: v.trim() || undefined }), 400);

const opcoes = computed(() => ({
  regiao: REGIOES_ENUM.map((r) => ({ valor: r, rotulo: REGIAO_ENUM_ROTULO[r] })),
  uf: UFS.map((u) => ({ valor: u, rotulo: u })),
  gestor: (reps.data.value ?? []).map((r) => ({ valor: r.id, rotulo: r.nomeExibicao })),
  segmento: [
    { valor: 'PUBLICO', rotulo: 'Público' },
    { valor: 'PRIVADO', rotulo: 'Privado' },
    { valor: 'SEM', rotulo: 'Sem segmento' },
  ],
  status: (status.data.value ?? []).map((s) => ({
    valor: s.codigo,
    rotulo: s.descricao === s.codigo ? s.codigo : `${s.codigo} — ${s.descricao}`,
  })),
}));
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
    <div v-if="!semPeriodo" class="flex flex-wrap items-center gap-2">
      <CalendarDays class="size-4 text-muted-foreground" aria-hidden="true" />
      <select
        class="h-8 rounded-md border bg-background px-2 text-sm"
        aria-label="Mês inicial"
        :value="de"
        @change="mudarPeriodo('de', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="m in opcoesMes" :key="m" :value="m">{{ rotuloMes(m) }}</option>
      </select>
      <span class="text-sm text-muted-foreground">até</span>
      <select
        class="h-8 rounded-md border bg-background px-2 text-sm"
        aria-label="Mês final"
        :value="ate"
        @change="mudarPeriodo('ate', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="m in opcoesMes" :key="m" :value="m">{{ rotuloMes(m) }}</option>
      </select>
      <UButton color="neutral" variant="ghost" size="sm" label="Último mês" @click="atalho('mes')" />
      <UButton color="neutral" variant="ghost" size="sm" label="Ano" @click="atalho('ano')" />
    </div>

    <div class="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
      <DashboardMultiFiltro
        rotulo="Região"
        :opcoes="opcoes.regiao"
        :selecionados="filtros.regiao"
        @alterar="(v) => definir({ regiao: v })"
      />
      <DashboardMultiFiltro
        rotulo="UF"
        :opcoes="opcoes.uf"
        :selecionados="filtros.uf"
        @alterar="(v) => definir({ uf: v })"
      />
      <DashboardMultiFiltro
        rotulo="Representante"
        :opcoes="opcoes.gestor"
        :selecionados="filtros.gestor"
        @alterar="(v) => definir({ gestor: v })"
      />
      <DashboardMultiFiltro
        rotulo="Segmento"
        :opcoes="opcoes.segmento"
        :selecionados="filtros.segmento"
        @alterar="(v) => definir({ segmento: v })"
      />
      <DashboardMultiFiltro
        rotulo="Status"
        :opcoes="opcoes.status"
        :selecionados="filtros.status"
        @alterar="(v) => definir({ status: v })"
      />
      <UInput
        v-model="busca"
        icon="i-lucide-search"
        size="sm"
        class="w-full sm:w-56"
        placeholder="Cliente, pedido, CPR, representante"
        aria-label="Buscar"
        @update:model-value="(v) => buscar(String(v))"
      />
      <UButton
        v-if="ativos"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-x"
        :label="`Limpar (${ativos})`"
        @click="limpar"
      />
    </div>
  </div>
</template>
