<script setup lang="ts">
import { redefinirSenhaSchema } from '@meta-bi/shared';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';

definePageMeta({ layout: 'auth' });
useHead({ title: 'Redefinir senha — BI Meta Hospitalar' });

const route = useRoute();
const token = typeof route.query.token === 'string' ? route.query.token : '';
const erro = ref<string | null>(token ? null : 'Link inválido. Peça um novo em "Esqueci minha senha".');

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(redefinirSenhaSchema),
  initialValues: { token, novaSenha: '', confirmacao: '' },
});
const [novaSenha, novaAttrs] = defineField('novaSenha');
const [confirmacao, confAttrs] = defineField('confirmacao');

const salvar = handleSubmit(async (dados) => {
  erro.value = null;
  try {
    await $fetch('/api/auth/redefinir-senha', { method: 'POST', body: dados });
    toast.success('Senha redefinida. Entre com a nova senha.');
    await navigateTo('/login');
  } catch {
    erro.value = 'Link inválido ou expirado. Peça um novo em "Esqueci minha senha".';
  }
});
</script>

<template>
  <form class="space-y-5" novalidate @submit="salvar">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">Definir nova senha</h1>
      <p class="text-sm text-muted-foreground">Mínimo de 10 caracteres, com letras e números.</p>
    </div>
    <p
      v-if="erro"
      class="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {{ erro }}
    </p>
    <UiExtraFormField
      id="nova-senha"
      v-model="novaSenha"
      v-bind="novaAttrs"
      label="Nova senha"
      type="password"
      autocomplete="new-password"
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
    <Button type="submit" class="h-10 w-full" :disabled="isSubmitting || !token">
      <Loader2 v-if="isSubmitting" class="animate-spin" /> Salvar nova senha
    </Button>
  </form>
</template>
