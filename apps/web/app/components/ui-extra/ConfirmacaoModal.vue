<script setup lang="ts">
import { mensagemErro } from '~/composables/api/useApi';
import type { ConfirmacaoOpcoes } from '~/composables/useConfirmacao';

const props = defineProps<ConfirmacaoOpcoes>();
const emit = defineEmits<{ close: [confirmado: boolean] }>();

const texto = ref(props.campo?.inicial ?? '');
const pendente = ref(false);
const erro = ref<string>();

async function confirmar() {
  if (props.campo && !texto.value.trim()) {
    erro.value = `Informe: ${props.campo.rotulo.toLowerCase()}.`;
    return;
  }
  erro.value = undefined;
  if (props.acao) {
    pendente.value = true;
    try {
      await props.acao(texto.value.trim());
    } catch (e) {
      erro.value = mensagemErro(e);
      return;
    } finally {
      pendente.value = false;
    }
  }
  emit('close', true);
}
</script>

<template>
  <UModal :title="titulo" :description="descricao" :dismissible="!pendente" :close="!pendente">
    <template #body>
      <form id="form-confirmacao" class="space-y-3" @submit.prevent="confirmar">
        <UFormField v-if="campo" :label="campo.rotulo" name="texto">
          <UInput v-model="texto" :placeholder="campo.placeholder" class="w-full" autofocus />
        </UFormField>
        <p v-if="erro" class="text-sm text-danger" role="alert">{{ erro }}</p>
        <p v-else-if="!campo" class="sr-only">Confirme ou cancele a ação.</p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancelar"
          :disabled="pendente"
          @click="emit('close', false)"
        />
        <UButton
          type="submit"
          form="form-confirmacao"
          :color="perigo ? 'error' : 'primary'"
          :label="rotuloConfirmar ?? 'Confirmar'"
          :loading="pendente"
        />
      </div>
    </template>
  </UModal>
</template>
