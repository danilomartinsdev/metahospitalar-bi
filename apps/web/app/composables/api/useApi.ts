import type { ErroApi } from '@meta-bi/shared';
import { useAuthStore } from '~/stores/auth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Partial<ErroApi>,
  ) {
    super(body.message ?? `Erro ${status}`);
  }
  get code() {
    return this.body.code;
  }
}

type Opcoes = Parameters<typeof $fetch>[1];

/**
 * Cliente HTTP da API: injeta o access token (em memória) e, num 401,
 * tenta um refresh silencioso uma única vez antes de desistir.
 */
export function useApi() {
  const auth = useAuthStore();

  async function request<T>(url: string, opts: Opcoes = {}, retry = true): Promise<T> {
    try {
      return (await $fetch<T>(`/api${url}`, {
        ...opts,
        credentials: 'include',
        headers: {
          ...(opts?.headers as Record<string, string> | undefined),
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
        },
      })) as T;
    } catch (e: unknown) {
      const err = e as { status?: number; statusCode?: number; data?: Partial<ErroApi> };
      const status = err.status ?? err.statusCode ?? 0;
      if (status === 401 && retry && !url.startsWith('/auth/')) {
        const ok = await auth.refresh();
        if (ok) return request<T>(url, opts, false);
        await auth.expirarSessao();
      }
      throw new ApiError(status, err.data ?? { message: 'Não foi possível falar com o servidor.' });
    }
  }

  return { request };
}
