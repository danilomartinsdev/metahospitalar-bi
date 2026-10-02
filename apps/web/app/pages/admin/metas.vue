<script setup lang="ts">
import { useMetasQuery, useRepresentantesQuery, useSalvarMetas } from '~/composables/api/useCadastros';

const aviso = useAviso();
definePageMeta({ titulo: 'Metas', permissao: 'metas.edit' });
useHead({ title: 'Metas — BI Meta Hospitalar' });

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const anoAtual = new Date().getFullYear();
const ano = ref(anoAtual);
const metas = useMetasQuery(ano);
const reps = useRepresentantesQuery();
const salvarMut = useSalvarMetas();

/** Grade editável: chave `${representanteId ?? 'total'}:${mes}` → texto digitado. */
const grade = ref<Record<string, string>>({});
const chave = (rep: string | null, mes: number) => `${rep ?? 'total'}:${mes}`;
const linhas = computed(() => [
  { id: null as string | null, nome: 'Meta total da empresa' },
  ...(reps.data.value ?? [])
    .filter((r) => r.ativo)
    .map((r) => ({ id: r.id as string | null, nome: r.nomeExibicao })),
]);

watch(
  () => metas.data.value,
  (dados) => {
    const g: Record<string, string> = {};
    for (const m of dados ?? [])
      g[chave(m.representanteId, m.mes)] = Number(m.valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      });
    grade.value = g;
  },
  { immediate: true },
);

async function salvar() {
  const lista = linhas.value.flatMap((l) =>
    MESES.map((_, i) => {
      const v = grade.value[chave(l.id, i + 1)]?.trim();
      return { mes: i + 1, representanteId: l.id, valor: v ? v : null };
    }),
  );
  try {
    await salvarMut.mutateAsync({ ano: ano.value, metas: lista });
    aviso.sucesso('Metas salvas.');
  } catch (e) {
    aviso.erro(e, 'Verifique os valores digitados.');
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <UiExtraPageHeader titulo="Metas" descricao="Metas mensais em R$: total da empresa e por representante.">
      <USelect v-model="ano" :items="[anoAtual - 1, anoAtual, anoAtual + 1]" class="w-28" aria-label="Ano" />
      <UButton icon="i-lucide-save" label="Salvar" :loading="salvarMut.isPending.value" @click="salvar" />
    </UiExtraPageHeader>

    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="metas.isPending.value || reps.isPending.value"
        :erro="metas.error.value || reps.error.value"
        @tentar-de-novo="metas.refetch()"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th class="sticky left-0 bg-muted px-4 py-3 text-left font-medium">Representante</th>
                <th v-for="m in MESES" :key="m" class="px-1 py-3 text-right font-medium">{{ m }}</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="l in linhas"
                :key="l.id ?? 'total'"
                :class="l.id === null && 'bg-primary-soft/50 font-medium'"
              >
                <th
                  class="sticky left-0 max-w-56 truncate bg-card px-4 py-2 text-left font-medium"
                  :title="l.nome"
                >
                  {{ l.nome }}
                </th>
                <td v-for="(m, i) in MESES" :key="m" class="px-1 py-1.5">
                  <input
                    v-model="grade[chave(l.id, i + 1)]"
                    inputmode="decimal"
                    placeholder="—"
                    class="num h-8 w-28 rounded-md border bg-background px-2 text-right text-sm focus-visible:border-ring"
                    :aria-label="`Meta de ${l.nome} em ${m}`"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiExtraEstadoBloco>
    </section>
    <p class="text-xs text-muted-foreground">
      Deixe em branco para remover a meta do mês. Valores aceitam "1.234,56".
    </p>
  </div>
</template>
