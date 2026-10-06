<script setup lang="ts">
import type { PreviaFaturamento } from '@meta-bi/shared';
import { useConfirmarFaturamento, usePreviaFaturamento } from '~/composables/api/useFaturamento';

const aberto = defineModel<boolean>('aberto', { required: true });
const aviso = useAviso();
const previaMut = usePreviaFaturamento();
const confirmarMut = useConfirmarFaturamento();
const previa = ref<PreviaFaturamento | null>(null);
const arrastando = ref(false);

const EXTENSOES = ['.xls', '.xlsx', '.csv', '.html', '.htm'];
const TAMANHO_MAX = 4 * 1024 * 1024;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

watch(aberto, (v) => {
  if (!v) {
    previa.value = null;
    previaMut.reset();
  }
});

async function enviar(arquivo?: File) {
  if (!arquivo) return;
  if (!EXTENSOES.some((e) => arquivo.name.toLowerCase().endsWith(e))) {
    aviso.erro('Formato não suportado. Envie o relatório de faturamento do Focco (.xls).');
    return;
  }
  if (arquivo.size > TAMANHO_MAX) {
    aviso.erro('Arquivo grande demais. O limite é 4 MB.');
    return;
  }
  previa.value = null;
  try {
    previa.value = await previaMut.mutateAsync(arquivo);
  } catch (e) {
    aviso.erro(e, 'Não foi possível ler o arquivo.');
  }
}

async function confirmar() {
  if (!previa.value) return;
  try {
    const r = await confirmarMut.mutateAsync({
      hash: previa.value.hash,
      arquivoNome: previa.value.arquivoNome,
    });
    aviso.sucesso(
      `Faturamento de ${r.ano} importado: ${r.dias} dias${r.substituidos ? ` (substituiu ${r.substituidos})` : ''}.`,
    );
    aberto.value = false;
  } catch (e) {
    aviso.erro(e, 'Não foi possível importar.');
  }
}

const podeConfirmar = computed(
  () => !!previa.value && previa.value.ano !== null && !previa.value.erros.length,
);
</script>

<template>
  <UModal
    v-model:open="aberto"
    title="Importar faturamento"
    description="Relatório diário de faturamento do Focco (uma linha por dia). Substitui só os meses que estão no arquivo."
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:border-primary"
        :class="arrastando ? 'border-primary bg-primary-soft' : 'hover:border-primary/60'"
        @dragover.prevent="arrastando = true"
        @dragleave.prevent="arrastando = false"
        @drop.prevent="
          arrastando = false;
          enviar($event.dataTransfer?.files?.[0]);
        "
      >
        <UIcon name="i-lucide-file-up" class="size-7 text-primary" />
        <span class="font-medium">{{
          previaMut.isPending.value ? 'Lendo arquivo…' : 'Arraste o arquivo aqui ou clique para escolher'
        }}</span>
        <span class="text-xs text-muted-foreground">.xls exportado do Focco — até 4 MB</span>
        <input
          type="file"
          class="sr-only"
          accept=".xls,.xlsx,.csv,.html,.htm"
          @change="
            enviar(($event.target as HTMLInputElement).files?.[0]);
            ($event.target as HTMLInputElement).value = '';
          "
        />
      </label>

      <div v-if="previa" class="mt-5 space-y-4">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">Ano</p>
            <p class="num text-lg font-semibold">{{ previa.ano ?? '—' }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">Dias</p>
            <p class="num text-lg font-semibold">{{ formatInt(previa.dias) }}</p>
          </div>
          <div class="col-span-2 rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">Fatura DRE no arquivo</p>
            <p class="num text-lg font-semibold">{{ formatBRL(previa.totais.dre) }}</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          Meses:
          {{
            previa.meses.map((m) => `${MESES[m.mes - 1]} (${m.dias} dias, ${formatBRL(m.dre)})`).join(' · ')
          }}
        </p>

        <UAlert
          v-if="previa.diasSubstituidos"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`Vai substituir ${previa.diasSubstituidos} dias já importados de ${previa.meses.map((m) => MESES[m.mes - 1]).join(', ')}/${previa.ano}`"
          description="O faturamento desses meses será trocado pelo deste arquivo; os outros meses não mudam."
        />

        <UAlert
          v-if="previa.erros.length"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-x"
          :title="`${previa.erros.length} linha(s) com erro — corrija o arquivo e envie de novo`"
        >
          <template #description>
            <ul class="mt-1 space-y-0.5 text-xs">
              <li v-for="e in previa.erros.slice(0, 8)" :key="e.linha">
                Linha {{ e.linha }}: {{ e.mensagens.join('; ') }}
              </li>
              <li v-if="previa.erros.length > 8">… e mais {{ previa.erros.length - 8 }}.</li>
            </ul>
          </template>
        </UAlert>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Cancelar" @click="aberto = false" />
        <UButton
          icon="i-lucide-check"
          label="Importar"
          :disabled="!podeConfirmar"
          :loading="confirmarMut.isPending.value"
          @click="confirmar"
        />
      </div>
    </template>
  </UModal>
</template>
