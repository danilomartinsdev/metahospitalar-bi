<script setup lang="ts">
import { SEGMENTO_ROTULO, SEGMENTOS, type Segmento } from '@meta-bi/shared';
import { refDebounced } from '@vueuse/core';
import { Search } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Input } from '~/components/ui/input';
import { useAtualizarCliente, useClientesAdminQuery } from '~/composables/api/useAdmin';

definePageMeta({ titulo: 'Segmento por cliente', permissao: 'cadastros.edit' });
useHead({ title: 'Segmento por cliente — BI Meta Hospitalar' });

const busca = ref('');
const buscaDebounced = refDebounced(busca, 350);
const page = ref(1);
watch(buscaDebounced, () => (page.value = 1));
const qs = computed(() =>
  new URLSearchParams({
    page: String(page.value),
    pageSize: '25',
    ...(buscaDebounced.value ? { busca: buscaDebounced.value } : {}),
  }).toString(),
);
const q = useClientesAdminQuery(qs);
const atualizar = useAtualizarCliente();
const paginas = computed(() => Math.max(1, Math.ceil((q.data.value?.meta.total ?? 0) / 25)));

async function salvar(id: string, v: string) {
  try {
    await atualizar.mutateAsync({ id, segmentoOverride: (v || null) as Segmento | null });
    toast.success('Segmento salvo.');
  } catch {
    toast.error('Não foi possível salvar.');
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <UiExtraPageHeader
      titulo="Segmento por cliente"
      descricao="Por padrão o segmento vem do representante. Defina aqui só as exceções (ex.: cliente público atendido por representante privado)."
    />
    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
      <Input v-model="busca" class="pl-9" placeholder="Buscar cliente" aria-label="Buscar cliente" />
    </div>
    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="q.isPending.value"
        :erro="q.error.value"
        :vazio="!q.data.value?.data.length"
        texto-vazio="Nenhum cliente encontrado."
        @tentar-de-novo="q.refetch()"
      >
        <table class="w-full text-sm">
          <thead class="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th class="px-5 py-3 font-medium">Cliente</th>
              <th class="px-5 py-3 font-medium">Segmento</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="c in q.data.value?.data" :key="c.id">
              <td class="px-5 py-2">{{ c.nomeOriginal }}</td>
              <td class="px-5 py-2">
                <select
                  class="h-8 rounded-md border bg-background px-2 text-sm"
                  :value="c.segmentoOverride ?? ''"
                  :aria-label="`Segmento de ${c.nomeOriginal}`"
                  @change="salvar(c.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Do representante</option>
                  <option v-for="s in SEGMENTOS" :key="s" :value="s">{{ SEGMENTO_ROTULO[s] }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-end gap-2 border-t px-4 py-3 text-sm">
          <button
            type="button"
            class="rounded-md border px-3 py-1 disabled:opacity-40"
            :disabled="page <= 1"
            @click="page--"
          >
            Anterior
          </button>
          <span class="num">{{ page }} / {{ paginas }}</span>
          <button
            type="button"
            class="rounded-md border px-3 py-1 disabled:opacity-40"
            :disabled="page >= paginas"
            @click="page++"
          >
            Próxima
          </button>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
