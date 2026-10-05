import { mensagemErro } from '~/composables/api/useApi';

/** Avisos (toasts) padronizados do app sobre o useToast do Nuxt UI. */
export function useAviso() {
  const toast = useToast();
  return {
    sucesso: (titulo: string) =>
      toast.add({ title: titulo, color: 'success', icon: 'i-lucide-circle-check' }),
    erro: (e: unknown, padrao?: string) =>
      toast.add({
        title: typeof e === 'string' ? e : mensagemErro(e, padrao),
        color: 'error',
        icon: 'i-lucide-circle-alert',
      }),
  };
}
