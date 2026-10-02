<script setup lang="ts">
import { loginSchema } from '@meta-bi/shared';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { Button } from '~/components/ui/button';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: 'auth' });
useHead({ title: 'Entrar — BI Meta Hospitalar' });

const auth = useAuthStore();
const route = useRoute();
const erroGeral = ref<string | null>(
  route.query.motivo === 'sessao-expirada' ? 'Sua sessão expirou. Entre novamente.' : null,
);

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { email: '', senha: '' },
});
const [email, emailAttrs] = defineField('email');
const [senha, senhaAttrs] = defineField('senha');

const MENSAGENS: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  ACCOUNT_LOCKED: 'Acesso bloqueado temporariamente após várias tentativas. Tente de novo mais tarde.',
  ACCOUNT_DISABLED: 'Usuário desativado. Fale com o administrador.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um minuto.',
};

const entrar = handleSubmit(async (dados) => {
  erroGeral.value = null;
  try {
    const usuario = await auth.login(dados);
    const destino =
      typeof route.query.r === 'string' && route.query.r.startsWith('/') ? route.query.r : '/dashboard';
    await navigateTo(usuario.trocarSenha ? '/trocar-senha' : destino);
  } catch (e: unknown) {
    const code = (e as { data?: { code?: string } }).data?.code;
    erroGeral.value = (code && MENSAGENS[code]) ?? 'Não foi possível entrar. Tente novamente.';
  }
});
</script>

<template>
  <form class="space-y-5" novalidate @submit="entrar">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">Entrar</h1>
      <p class="text-sm text-muted-foreground">Use seu e-mail corporativo.</p>
    </div>

    <p
      v-if="erroGeral"
      class="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {{ erroGeral }}
    </p>

    <UiExtraFormField
      id="email"
      v-model="email"
      v-bind="emailAttrs"
      label="E-mail"
      type="email"
      autocomplete="username"
      inputmode="email"
      :erro="errors.email"
    />
    <UiExtraFormField
      id="senha"
      v-model="senha"
      v-bind="senhaAttrs"
      label="Senha"
      type="password"
      autocomplete="current-password"
      :erro="errors.senha"
    >
      <template #acao>
        <NuxtLink to="/esqueci-senha" class="text-xs font-medium text-primary hover:underline"
          >Esqueci minha senha</NuxtLink
        >
      </template>
    </UiExtraFormField>

    <Button type="submit" class="h-10 w-full" :disabled="isSubmitting">
      <Loader2 v-if="isSubmitting" class="animate-spin" /> Entrar
    </Button>
  </form>
</template>
