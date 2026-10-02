<script setup lang="ts">
import { SEGMENTO_ROTULO, SEGMENTOS, type Segmento } from '@meta-bi/shared';
import { toast } from 'vue-sonner';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import {
  type Representante,
  useAtualizarRepresentante,
  useRepresentantesQuery,
} from '~/composables/api/useCadastros';

definePageMeta({ titulo: 'Representantes', permissao: 'cadastros.edit' });
useHead({ title: 'Representantes — BI Meta Hospitalar' });

const reps = useRepresentantesQuery();
const atualizar = useAtualizarRepresentante();

async function salvar(
  r: Representante,
  dados: Parameters<typeof atualizar.mutateAsync>[0]['dados'],
  msg = 'Salvo.',
) {
  try {
    await atualizar.mutateAsync({ id: r.id, dados });
    toast.success(msg);
  } catch {
    toast.error('Não foi possível salvar.');
  }
}

function salvarNome(r: Representante, e: Event) {
  const nome = (e.target as HTMLInputElement).value.trim();
  if (nome && nome !== r.nomeExibicao) void salvar(r, { nomeExibicao: nome }, 'Nome atualizado.');
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <UiExtraPageHeader
      titulo="Representantes"
      descricao="Representantes vindos do Focco. Ajuste o nome de exibição, o segmento padrão e se estão ativos."
    />
    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="reps.isPending.value"
        :erro="reps.error.value"
        :vazio="!reps.data.value?.length"
        texto-vazio="Nenhum representante. Eles são criados automaticamente na importação."
        @tentar-de-novo="reps.refetch()"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Código (Focco)</th>
                <th class="px-3 py-3 font-medium">Nome de exibição</th>
                <th class="px-3 py-3 font-medium">Segmento padrão</th>
                <th class="px-5 py-3 font-medium">Ativo</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="r in reps.data.value" :key="r.id">
                <td class="px-5 py-2 font-medium">{{ r.codigo }}</td>
                <td class="px-3 py-2">
                  <Input
                    :model-value="r.nomeExibicao"
                    class="h-9 min-w-56"
                    :aria-label="`Nome de exibição de ${r.codigo}`"
                    @blur="salvarNome(r, $event)"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                  />
                </td>
                <td class="px-3 py-2">
                  <select
                    class="h-9 rounded-md border bg-background px-2 text-sm"
                    :value="r.segmentoPadrao ?? ''"
                    :aria-label="`Segmento de ${r.codigo}`"
                    @change="
                      salvar(r, {
                        segmentoPadrao: (($event.target as HTMLSelectElement).value ||
                          null) as Segmento | null,
                      })
                    "
                  >
                    <option value="">Não definido</option>
                    <option v-for="s in SEGMENTOS" :key="s" :value="s">{{ SEGMENTO_ROTULO[s] }}</option>
                  </select>
                </td>
                <td class="px-5 py-2">
                  <label class="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      class="size-4 accent-primary"
                      :checked="r.ativo"
                      @change="salvar(r, { ativo: ($event.target as HTMLInputElement).checked })"
                    />
                    <Badge :variant="r.ativo ? 'default' : 'secondary'">{{
                      r.ativo ? 'Ativo' : 'Inativo'
                    }}</Badge>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
