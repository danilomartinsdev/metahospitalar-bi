<script setup lang="ts">
import type { AuthResposta } from '@meta-bi/shared';
import { trocarSenhaSchema } from '@meta-bi/shared';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';
import { useApi } from '~/composables/api/useApi';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const obrigatoria = computed(() => auth.usuario?.trocarSenha === true);
definePageMeta({ layout: 'auth' });
useHead({ title: 'Trocar senha — BI Meta Hospitalar' });

const { request } = useApi();
const erro = ref<string | null>(null);
const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(trocarSenhaSchema),
  initialValues: { senhaAtual: '', novaSenha: '', confirmacao: '' },
});
const [senhaAtual, atualAttrs] = defineField('senhaAtual');
const [novaSenha, novaAttrs] = defineField('novaSenha');
const [confirmacao, confAttrs] = defineField('confirmacao');

const salvar = handleSubmit(async (dados) => {
  erro.value = null;
  try {
    // A troca revoga as outras sessões e devolve uma sessão nova.
    const r = await request<AuthResposta>('/auth/trocar-senha', { method: 'POST', body: dados });
    auth.aplicar(r);
    toast.success('Senha alterada.');
    await navigateTo('/dashboard');
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    erro.value =
      code === 'INVALID_CREDENTIALS' ? 'A senha atual está incorreta.' : 'Não foi possível trocar a senha.';
  }
});
</script>

<template>
  <form class="space-y-5" novalidate @submit="salvar">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">{{ obrigatoria ? 'Crie sua senha' : 'Trocar senha' }}</h1>
      <p class="text-sm text-muted-foreground">
        {{
          obrigatoria
            ? 'Por segurança, troque a senha provisória antes de continuar.'
            : 'Mínimo de 10 caracteres, com letras e números.'
        }}
      </p>
    </div>
    <p
      v-if="erro"
      class="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {{ erro }}
    </p>
    <UiExtraFormField
      id="senha-atual"
      v-model="senhaAtual"
      v-bind="atualAttrs"
      :label="obrigatoria ? 'Senha provisória' : 'Senha atual'"
      type="password"
      autocomplete="current-password"
      :erro="errors.senhaAtual"
    />
    <UiExtraFormField
      id="nova-senha"
      v-model="novaSenha"
      v-bind="novaAttrs"
      label="Nova senha"
      type="password"
      autocomplete="new-password"
      dica="Mínimo de 10 caracteres, com letras e números."
      :erro="errors.novaSenha"
    />
    <UiExtraFormField
      id="confirmacao"
      v-model="confirmacao"
      v-bind="confAttrs"
      label="Confirme a nova senha"
      type="password"
      autocomplete="new-password"
      :erro="errors.confirmacao"
    />
    <Button type="submit" class="h-10 w-full" :disabled="isSubmitting">
      <Loader2 v-if="isSubmitting" class="animate-spin" /> Salvar
    </Button>
    <p v-if="!obrigatoria" class="text-center">
      <NuxtLink to="/dashboard" class="text-sm text-muted-foreground hover:text-foreground"
        >Cancelar</NuxtLink
      >
    </p>
    <p v-else class="text-center">
      <button
        type="button"
        class="text-sm text-muted-foreground hover:text-foreground"
        @click="auth.logout()"
      >
        Sair
      </button>
    </p>
  </form>
</template>
