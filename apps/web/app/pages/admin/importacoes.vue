<script setup lang="ts">
import type { PreviaImportacao } from '@meta-bi/shared';
import { CheckCircle2, FileUp, Loader2, RotateCcw, TriangleAlert, Upload } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  useConfirmarImportacao,
  useLotesQuery,
  usePreviaImportacao,
  useReverterLote,
} from '~/composables/api/useCadastros';
import type { ApiError } from '~/composables/api/useApi';

definePageMeta({ titulo: 'Importações', permissao: 'import.run' });
useHead({ title: 'Importações — BI Meta Hospitalar' });

const can = useCan();
const lotes = useLotesQuery();
const previaMut = usePreviaImportacao();
const confirmarMut = useConfirmarImportacao();
const reverterMut = useReverterLote();

const previa = ref<PreviaImportacao | null>(null);
const arrastando = ref(false);
const input = ref<HTMLInputElement>();

async function enviar(arquivo?: File) {
  if (!arquivo) return;
  previa.value = null;
  try {
    previa.value = await previaMut.mutateAsync(arquivo);
  } catch (e) {
    toast.error((e as ApiError).message ?? 'Não foi possível ler o arquivo.');
  }
}

function soltar(e: DragEvent) {
  arrastando.value = false;
  void enviar(e.dataTransfer?.files[0]);
}

async function confirmar() {
  if (!previa.value) return;
  try {
    const r = await confirmarMut.mutateAsync({
      hash: previa.value.hash,
      arquivoNome: previa.value.arquivoNome,
    });
    toast.success(`Importação concluída: ${r.novos} novos, ${r.atualizados} atualizados.`);
    previa.value = null;
  } catch (e) {
    toast.error((e as ApiError).message ?? 'Falha ao importar.');
  }
}

async function reverter(id: string, nome: string) {
  if (
    !confirm(
      `Desfazer a importação "${nome}"? Os pedidos criados por ela serão apagados e os alterados voltam ao estado anterior.`,
    )
  )
    return;
  try {
    await reverterMut.mutateAsync(id);
    toast.success('Importação desfeita.');
  } catch (e) {
    toast.error((e as ApiError).message ?? 'Não foi possível desfazer.');
  }
}

const resumo = computed(() =>
  previa.value
    ? [
        { rotulo: 'Novos', valor: previa.value.novos, cor: 'text-success' },
        { rotulo: 'Atualizados', valor: previa.value.atualizados, cor: 'text-primary' },
        { rotulo: 'Sem mudança', valor: previa.value.inalterados, cor: 'text-muted-foreground' },
        {
          rotulo: 'Com erro',
          valor: previa.value.erros.length,
          cor: previa.value.erros.length ? 'text-danger' : 'text-muted-foreground',
        },
      ]
    : [],
);
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <UiExtraPageHeader
      titulo="Importações"
      descricao='Envie o relatório "DASHBOARD_Extrator PDV" exportado do Focco3i.'
    />

    <!-- 1. Upload -->
    <label
      class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors"
      :class="arrastando ? 'border-primary bg-primary-soft' : 'hover:border-primary/60'"
      @dragover.prevent="arrastando = true"
      @dragleave.prevent="arrastando = false"
      @drop.prevent="soltar"
    >
      <Loader2 v-if="previaMut.isPending.value" class="size-8 animate-spin text-primary" />
      <Upload v-else class="size-8 text-primary" aria-hidden="true" />
      <span class="font-medium">{{
        previaMut.isPending.value ? 'Lendo arquivo…' : 'Arraste o arquivo aqui ou clique para escolher'
      }}</span>
      <span class="text-xs text-muted-foreground">.xls, .xlsx ou .csv — até 10 MB</span>
      <input
        ref="input"
        type="file"
        class="sr-only"
        accept=".xls,.xlsx,.csv,.html"
        @change="
          enviar(($event.target as HTMLInputElement).files?.[0]);
          ($event.target as HTMLInputElement).value = '';
        "
      />
    </label>

    <!-- 2/3. Prévia -->
    <section v-if="previa" class="space-y-4 rounded-xl border bg-card p-5" aria-label="Prévia da importação">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="flex items-center gap-2 font-semibold">
            <FileUp class="size-4" /> {{ previa.arquivoNome }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ previa.totalLinhas }} linhas · formato {{ previa.formato.toUpperCase() }}
            <template v-if="previa.periodo">
              · {{ formatDate(previa.periodo.de) }} a {{ formatDate(previa.periodo.ate) }}</template
            >
            · total <span class="num">{{ formatBRL(previa.valorTotal) }}</span>
          </p>
        </div>
        <Badge v-if="previa.jaImportado" variant="secondary">Este arquivo já foi importado</Badge>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div v-for="r in resumo" :key="r.rotulo" class="rounded-lg border p-3">
          <p class="text-xs text-muted-foreground">{{ r.rotulo }}</p>
          <p class="num text-2xl font-semibold" :class="r.cor">{{ formatInt(r.valor) }}</p>
        </div>
      </div>

      <div
        v-if="previa.representantesNovos.length || previa.statusNovos.length || previa.clientesNovos"
        class="space-y-1 text-sm"
      >
        <p v-if="previa.representantesNovos.length">
          <span class="font-medium">Representantes novos:</span> {{ previa.representantesNovos.join(', ') }}
        </p>
        <p v-if="previa.statusNovos.length">
          <span class="font-medium">Status novos:</span> {{ previa.statusNovos.join(', ') }}
        </p>
        <p v-if="previa.clientesNovos">
          <span class="font-medium">Clientes novos:</span> {{ formatInt(previa.clientesNovos) }}
        </p>
      </div>

      <div v-if="previa.erros.length" class="rounded-lg border border-danger/30">
        <p
          class="flex items-center gap-2 border-b border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
        >
          <TriangleAlert class="size-4" /> {{ previa.erros.length }} linha(s) com erro — serão ignoradas
        </p>
        <ul class="max-h-56 divide-y overflow-y-auto text-sm">
          <li v-for="e in previa.erros" :key="e.linha" class="flex gap-3 px-3 py-2">
            <span class="num w-20 shrink-0 text-muted-foreground">Linha {{ e.linha }}</span>
            <span>{{ e.mensagens.join('; ') }}</span>
          </li>
        </ul>
      </div>

      <!-- 4. Confirmação -->
      <div class="flex flex-wrap justify-end gap-2">
        <Button variant="outline" @click="previa = null">Cancelar</Button>
        <Button
          :disabled="confirmarMut.isPending.value || previa.novos + previa.atualizados === 0"
          @click="confirmar"
        >
          <Loader2 v-if="confirmarMut.isPending.value" class="animate-spin" />
          <CheckCircle2 v-else />
          Confirmar importação
        </Button>
      </div>
    </section>

    <!-- Histórico de lotes -->
    <section class="rounded-xl border bg-card">
      <h3 class="border-b px-5 py-4 font-semibold">Histórico</h3>
      <UiExtraEstadoBloco
        :carregando="lotes.isPending.value"
        :erro="lotes.error.value"
        :vazio="!lotes.data.value?.length"
        texto-vazio="Nenhuma importação ainda."
        @tentar-de-novo="lotes.refetch()"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Quando</th>
                <th class="px-3 py-3 font-medium">Arquivo</th>
                <th class="px-3 py-3 font-medium">Por</th>
                <th class="px-3 py-3 text-right font-medium">Novos</th>
                <th class="px-3 py-3 text-right font-medium">Atualiz.</th>
                <th class="px-3 py-3 text-right font-medium">Erros</th>
                <th class="px-3 py-3 font-medium">Situação</th>
                <th class="px-5 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="l in lotes.data.value" :key="l.id">
                <td class="num whitespace-nowrap px-5 py-3">{{ formatDateTime(l.createdAt) }}</td>
                <td class="max-w-56 truncate px-3 py-3" :title="l.arquivoNome">{{ l.arquivoNome }}</td>
                <td class="px-3 py-3">{{ l.usuario.nome }}</td>
                <td class="num px-3 py-3 text-right">{{ formatInt(l.novos) }}</td>
                <td class="num px-3 py-3 text-right">{{ formatInt(l.atualizados) }}</td>
                <td class="num px-3 py-3 text-right">{{ formatInt(l.erros) }}</td>
                <td class="px-3 py-3">
                  <Badge v-if="l.status === 'APLICADO'" class="bg-success/15 text-success">Aplicado</Badge>
                  <Badge
                    v-else
                    variant="secondary"
                    :title="l.revertidoPor ? `por ${l.revertidoPor.nome}` : ''"
                    >Desfeito</Badge
                  >
                </td>
                <td class="px-5 py-3 text-right">
                  <Button
                    v-if="l.status === 'APLICADO' && can('import.rollback')"
                    variant="ghost"
                    size="sm"
                    :disabled="reverterMut.isPending.value"
                    @click="reverter(l.id, l.arquivoNome)"
                  >
                    <RotateCcw /> Desfazer
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
