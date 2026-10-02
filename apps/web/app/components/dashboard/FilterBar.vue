<script setup lang="ts">
import { REGIAO_ENUM_ROTULO, REGIOES_ENUM, UFS } from '@meta-bi/shared';
import { useDebounceFn } from '@vueuse/core';
import { CalendarDays, Search, X } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
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
      <Button variant="ghost" size="sm" @click="atalho('mes')">Último mês</Button>
      <Button variant="ghost" size="sm" @click="atalho('ano')">Ano</Button>
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
        rotulo="Gestor"
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
      <div class="relative w-full sm:w-56">
        <Search class="absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          v-model="busca"
          class="h-8 pl-8"
          placeholder="Cliente, pedido, CPR, gestor"
          aria-label="Buscar"
          @update:model-value="(v) => buscar(String(v))"
        />
      </div>
      <Button v-if="ativos" variant="ghost" size="sm" @click="limpar"><X /> Limpar ({{ ativos }})</Button>
    </div>
  </div>
</template>
