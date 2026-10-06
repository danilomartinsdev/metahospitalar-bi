import type { FaturamentoResumo, LoteFaturamento, PreviaFaturamento } from '@meta-bi/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { useApi } from './useApi';

/** Resumo da página de Faturamento (domínio separado dos pedidos). */
export function useFaturamentoResumoQuery(qs: MaybeRefOrGetter<string>) {
  const { request } = useApi();
  return useQuery({
    queryKey: ['faturamento-resumo', qs],
    queryFn: () => request<FaturamentoResumo>(`/faturamento/resumo?${toValue(qs)}`),
    placeholderData: keepPreviousData,
  });
}

export function usePreviaFaturamento() {
  const { request } = useApi();
  return useMutation({
    mutationFn: (arquivo: File) => {
      const fd = new FormData();
      fd.append('arquivo', arquivo);
      return request<PreviaFaturamento>('/faturamento/import/previa', { method: 'POST', body: fd });
    },
  });
}

export function useConfirmarFaturamento() {
  const { request } = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { hash: string; arquivoNome: string; meses: number[] }) =>
      request<{ loteId: string; ano: number; meses: number[]; dias: number; substituidos: number }>(
        '/faturamento/import/confirmar',
        { method: 'POST', body: p },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['faturamento-resumo'] });
      void qc.invalidateQueries({ queryKey: ['faturamento-lotes'] });
    },
  });
}

export function useLotesFaturamentoQuery(habilitado: MaybeRefOrGetter<boolean>) {
  const { request } = useApi();
  return useQuery({
    queryKey: ['faturamento-lotes'],
    queryFn: () => request<LoteFaturamento[]>('/faturamento/import/lotes'),
    enabled: () => toValue(habilitado),
  });
}
