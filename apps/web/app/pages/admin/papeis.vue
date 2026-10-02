<script setup lang="ts">
import { PERMISSION_LABELS, PERMISSIONS, type PapelAdmin, type Permission } from '@meta-bi/shared';
import { Lock, Plus, Save, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import type { ApiError } from '~/composables/api/useApi';
import { usePapeisQuery, useRemoverPapel, useSalvarPapel } from '~/composables/api/useAdmin';

definePageMeta({ titulo: 'Papéis', permissao: 'users.manage' });
useHead({ title: 'Papéis — BI Meta Hospitalar' });

const papeis = usePapeisQuery();
const salvar = useSalvarPapel();
const remover = useRemoverPapel();

/** Rascunho editável por papel. */
const rascunho = ref<Record<string, { nome: string; permissoes: Permission[] }>>({});
watch(
  () => papeis.data.value,
  (lista) => {
    for (const p of lista ?? []) rascunho.value[p.id] ??= { nome: p.nome, permissoes: [...p.permissoes] };
  },
  { immediate: true },
);

const alterado = (p: PapelAdmin) => {
  const r = rascunho.value[p.id];
  return !!r && (r.nome !== p.nome || [...r.permissoes].sort().join() !== [...p.permissoes].sort().join());
};

function alternar(p: PapelAdmin, perm: Permission) {
  const r = rascunho.value[p.id]!;
  r.permissoes = r.permissoes.includes(perm)
    ? r.permissoes.filter((x) => x !== perm)
    : [...r.permissoes, perm];
}

async function gravar(p: PapelAdmin) {
  try {
    const r = await salvar.mutateAsync({ id: p.id, dados: rascunho.value[p.id]! });
    rascunho.value[p.id] = { nome: r.nome, permissoes: [...r.permissoes] };
    toast.success(`Papel "${r.nome}" salvo. Vale na próxima ação de cada usuário.`);
  } catch (e) {
    toast.error((e as ApiError).message);
  }
}

async function novo() {
  const nome = prompt('Nome do novo papel:')?.trim();
  if (!nome) return;
  try {
    await salvar.mutateAsync({ dados: { nome, permissoes: ['dashboard.view'] } });
    toast.success('Papel criado.');
  } catch (e) {
    toast.error((e as ApiError).message);
  }
}

async function apagar(p: PapelAdmin) {
  if (!confirm(`Remover o papel "${p.nome}"?`)) return;
  try {
    await remover.mutateAsync(p.id);
    toast.success('Papel removido.');
  } catch (e) {
    toast.error((e as ApiError).message);
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <UiExtraPageHeader
      titulo="Papéis e permissões"
      descricao="O que cada papel pode fazer. O escopo de dados é definido por usuário."
    >
      <Button variant="outline" @click="novo"><Plus /> Novo papel</Button>
    </UiExtraPageHeader>

    <UiExtraEstadoBloco
      :carregando="papeis.isPending.value"
      :erro="papeis.error.value"
      @tentar-de-novo="papeis.refetch()"
    >
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section
          v-for="p in papeis.data.value"
          :key="p.id"
          class="flex flex-col rounded-xl border bg-card p-5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <Input
                v-if="rascunho[p.id]"
                v-model="rascunho[p.id]!.nome"
                class="h-9 font-semibold"
                :disabled="p.chave === 'admin'"
                :aria-label="`Nome do papel ${p.nome}`"
              />
              <p class="mt-1 text-xs text-muted-foreground">{{ p.usuarios }} usuário(s)</p>
            </div>
            <Badge v-if="p.sistema" variant="secondary">padrão</Badge>
          </div>

          <p v-if="p.chave === 'admin'" class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock class="size-3.5" /> Admin sempre tem todas as permissões.
          </p>
          <ul class="mt-3 flex-1 space-y-1">
            <li v-for="perm in PERMISSIONS" :key="perm">
              <label
                class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
                :class="p.chave === 'admin' && 'cursor-not-allowed opacity-70'"
              >
                <input
                  type="checkbox"
                  class="accent-primary"
                  :disabled="p.chave === 'admin'"
                  :checked="rascunho[p.id]?.permissoes.includes(perm)"
                  @change="alternar(p, perm)"
                />
                {{ PERMISSION_LABELS[perm] }}
                <code class="ml-auto text-[10px] text-muted-foreground">{{ perm }}</code>
              </label>
            </li>
          </ul>

          <div class="mt-4 flex justify-between gap-2 border-t pt-4">
            <Button v-if="!p.sistema" variant="ghost" size="sm" class="text-danger" @click="apagar(p)"
              ><Trash2 /> Remover</Button
            >
            <span v-else />
            <Button size="sm" :disabled="!alterado(p) || salvar.isPending.value" @click="gravar(p)"
              ><Save /> Salvar</Button
            >
          </div>
        </section>
      </div>
    </UiExtraEstadoBloco>
  </div>
</template>
