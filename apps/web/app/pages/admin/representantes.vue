<script setup lang="ts">
import { SEGMENTO_ROTULO, SEGMENTOS, type Segmento } from '@meta-bi/shared';
import {
  type Representante,
  useAtualizarRepresentante,
  useRepresentantesQuery,
} from '~/composables/api/useCadastros';
import { useUsuariosQuery, useVincularRepresentante } from '~/composables/api/useAdmin';

const aviso = useAviso();
definePageMeta({ titulo: 'Representantes', permissao: 'cadastros.edit' });
useHead({ title: 'Representantes — BI Metahospitalar' });

const reps = useRepresentantesQuery();
const atualizar = useAtualizarRepresentante();

// Usuário de cada código: é o que faz "Minhas vendas" (e as demais telas) mostrar só as vendas dele.
// Ligar usuários exige users.manage (a API valida); sem ela a coluna nem aparece.
const can = useCan();
const podeLigar = computed(() => can('users.manage'));
const usuarios = useUsuariosQuery({ enabled: podeLigar });
const vincular = useVincularRepresentante();
const NINGUEM = 'NINGUEM';
const itensUsuario = computed(() => [
  { label: 'Ninguém', value: NINGUEM },
  ...(usuarios.data.value ?? [])
    .filter((u) => u.ativo && u.papel.chave !== 'admin')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((u) => ({ label: `${u.nome} (${u.papel.nome})`, value: u.id })),
]);
/** representanteId → usuário ligado (um por código). */
const usuarioDoCodigo = computed(() => {
  const m = new Map<string, string>();
  for (const u of usuarios.data.value ?? [])
    if (u.escopoTipo === 'representantes') for (const r of u.representantes) m.set(r.id, u.id);
  return m;
});

async function ligar(r: Representante, valor: string) {
  salvando.add(r.id);
  try {
    await vincular.mutateAsync({ representanteId: r.id, usuarioId: valor === NINGUEM ? null : valor });
    aviso.sucesso(valor === NINGUEM ? `${r.codigo} sem usuário.` : `${r.codigo} ligado ao usuário.`);
  } catch (e) {
    aviso.erro(e, 'Não foi possível ligar o usuário.');
  } finally {
    salvando.delete(r.id);
  }
}

/** O USelect não aceita '' como valor: NENHUM representa "sem segmento definido". */
const NENHUM = 'NENHUM';
const itensSegmento = [
  { label: 'Não definido', value: NENHUM },
  ...SEGMENTOS.map((s) => ({ label: SEGMENTO_ROTULO[s], value: s })),
];

/** Linhas com salvamento em andamento. */
const salvando = reactive(new Set<string>());

async function salvar(
  r: Representante,
  dados: Parameters<typeof atualizar.mutateAsync>[0]['dados'],
  msg = 'Salvo.',
) {
  salvando.add(r.id);
  try {
    await atualizar.mutateAsync({ id: r.id, dados });
    aviso.sucesso(msg);
  } catch (e) {
    aviso.erro(e, 'Não foi possível salvar.');
  } finally {
    salvando.delete(r.id);
  }
}

function salvarNome(r: Representante, e: Event) {
  const nome = (e.target as HTMLInputElement).value.trim();
  if (nome && nome !== r.nomeExibicao) void salvar(r, { nomeExibicao: nome }, 'Nome atualizado.');
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <UiExtraPageHeader
      titulo="Representantes"
      descricao="Representantes vindos do Focco. Ajuste o nome de exibição, o segmento padrão, se estão ativos e qual usuário do sistema é cada representante (ele verá só as vendas desse código)."
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
                <th v-if="podeLigar" class="px-3 py-3 font-medium">Usuário</th>
                <th class="px-5 py-3 font-medium">Ativo</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="r in reps.data.value"
                :key="r.id"
                :aria-busy="salvando.has(r.id)"
                class="transition-opacity"
                :class="salvando.has(r.id) && 'opacity-60'"
              >
                <td class="px-5 py-2 font-medium">{{ r.codigo }}</td>
                <td class="px-3 py-2">
                  <UInput
                    :model-value="r.nomeExibicao"
                    class="min-w-56"
                    :aria-label="`Nome de exibição de ${r.codigo}`"
                    @blur="salvarNome(r, $event)"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                  />
                </td>
                <td class="px-3 py-2">
                  <USelect
                    :model-value="r.segmentoPadrao ?? NENHUM"
                    :items="itensSegmento"
                    class="w-40"
                    :aria-label="`Segmento de ${r.codigo}`"
                    @update:model-value="
                      (v) => salvar(r, { segmentoPadrao: (v === NENHUM ? null : v) as Segmento | null })
                    "
                  />
                </td>
                <td v-if="podeLigar" class="px-3 py-2">
                  <USelect
                    :model-value="usuarioDoCodigo.get(r.id) ?? NINGUEM"
                    :items="itensUsuario"
                    :loading="usuarios.isPending.value"
                    class="w-56"
                    :aria-label="`Usuário do representante ${r.codigo}`"
                    @update:model-value="(v) => ligar(r, String(v))"
                  />
                </td>
                <td class="px-5 py-2">
                  <USwitch
                    :model-value="r.ativo"
                    :label="r.ativo ? 'Ativo' : 'Inativo'"
                    :aria-label="`${r.codigo} ativo`"
                    @update:model-value="(v) => salvar(r, { ativo: v })"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiExtraEstadoBloco>
    </section>
  </div>
</template>
