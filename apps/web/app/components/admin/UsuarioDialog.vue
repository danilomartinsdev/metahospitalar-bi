<script setup lang="ts">
import {
  type EscopoTipo,
  REGIAO_ENUM_ROTULO,
  REGIOES_ENUM,
  type RegiaoEnum,
  type UsuarioAdmin,
} from '@meta-bi/shared';
import { mensagemErro } from '~/composables/api/useApi';
import { usePapeisQuery, useSalvarUsuario } from '~/composables/api/useAdmin';
import { useRepresentantesQuery } from '~/composables/api/useCadastros';

const aviso = useAviso();
const aberto = defineModel<boolean>('aberto', { required: true });
const props = defineProps<{ usuario: UsuarioAdmin | null }>();
const emit = defineEmits<{ criado: [email: string, senha: string] }>();

const papeis = usePapeisQuery();
const reps = useRepresentantesQuery();
const salvar = useSalvarUsuario();

const form = reactive({
  nome: '',
  email: '',
  roleId: '',
  escopoTipo: 'representantes' as EscopoTipo,
  escopoRegioes: [] as RegiaoEnum[],
  representanteIds: [] as string[],
});
const erro = ref<string | null>(null);

watch(aberto, (v) => {
  if (!v) return;
  erro.value = null;
  const u = props.usuario;
  Object.assign(form, {
    nome: u?.nome ?? '',
    email: u?.email ?? '',
    roleId: u?.papel.id ?? papeis.data.value?.find((p) => p.chave === 'visualizador')?.id ?? '',
    escopoTipo: u?.escopoTipo ?? 'todos',
    escopoRegioes: [...(u?.escopoRegioes ?? [])],
    representanteIds: u?.representantes.map((r) => r.id) ?? [],
  });
});

const ESCOPOS: { v: EscopoTipo; r: string; d: string }[] = [
  { v: 'todos', r: 'Todos os pedidos', d: 'Vê a empresa inteira.' },
  { v: 'regiao', r: 'Por região', d: 'Só pedidos de UFs das regiões escolhidas.' },
  { v: 'representantes', r: 'Por representante', d: 'Só pedidos dos representantes vinculados.' },
];

function alternar<T>(lista: T[], item: T) {
  const i = lista.indexOf(item);
  if (i >= 0) lista.splice(i, 1);
  else lista.push(item);
}

async function enviar() {
  erro.value = null;
  const dados = {
    nome: form.nome,
    roleId: form.roleId,
    escopoTipo: form.escopoTipo,
    escopoRegioes: form.escopoRegioes,
    representanteIds: form.representanteIds,
    ...(props.usuario ? {} : { email: form.email }),
  };
  try {
    const r = await salvar.mutateAsync({ id: props.usuario?.id, dados: dados as never });
    aberto.value = false;
    if (r.senhaProvisoria) emit('criado', r.usuario.email, r.senhaProvisoria);
    else aviso.sucesso('Usuário atualizado.');
  } catch (e) {
    erro.value = mensagemErro(e);
  }
}
</script>

<template>
  <UModal
    v-model:open="aberto"
    :title="usuario ? 'Editar usuário' : 'Novo usuário'"
    :description="
      usuario
        ? 'Mudanças de papel e escopo valem na próxima ação do usuário.'
        : 'Uma senha provisória será gerada e exibida uma única vez.'
    "
  >
    <template #body>

      <form id="form-usuario" class="space-y-4" @submit.prevent="enviar">
        <p
          v-if="erro"
          class="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {{ erro }}
        </p>
        <div class="space-y-2">
          <label for="u-nome" class="text-sm font-medium">Nome</label>
          <UInput id="u-nome" v-model="form.nome" class="w-full" required minlength="2" />
        </div>
        <div class="space-y-2">
          <label for="u-email" class="text-sm font-medium">E-mail</label>
          <UInput id="u-email" v-model="form.email" class="w-full" type="email" required :disabled="!!usuario" />
        </div>
        <div class="space-y-2">
          <label for="u-papel" class="text-sm font-medium">Papel</label>
          <select
            id="u-papel"
            v-model="form.roleId"
            required
            class="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option v-for="p in papeis.data.value" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>

        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">Escopo de dados</legend>
          <label
            v-for="e in ESCOPOS"
            :key="e.v"
            class="flex cursor-pointer gap-3 rounded-lg border p-3"
            :class="form.escopoTipo === e.v && 'border-primary bg-primary-soft'"
          >
            <input
              v-model="form.escopoTipo"
              type="radio"
              name="escopo"
              :value="e.v"
              class="mt-1 accent-primary"
            />
            <span>
              <span class="block text-sm font-medium">{{ e.r }}</span>
              <span class="block text-xs text-muted-foreground">{{ e.d }}</span>
            </span>
          </label>
        </fieldset>

        <fieldset v-if="form.escopoTipo === 'regiao'" class="grid grid-cols-2 gap-2">
          <legend class="mb-1 text-sm font-medium">Regiões</legend>
          <label v-for="r in REGIOES_ENUM" :key="r" class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-primary"
              :checked="form.escopoRegioes.includes(r)"
              @change="alternar(form.escopoRegioes, r)"
            />
            {{ REGIAO_ENUM_ROTULO[r] }}
          </label>
        </fieldset>

        <fieldset v-if="form.escopoTipo === 'representantes'" class="space-y-1">
          <legend class="mb-1 text-sm font-medium">Representantes vinculados</legend>
          <div class="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
            <label
              v-for="r in reps.data.value"
              :key="r.id"
              class="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                class="accent-primary"
                :checked="form.representanteIds.includes(r.id)"
                @change="alternar(form.representanteIds, r.id)"
              />
              {{ r.nomeExibicao }}
            </label>
            <p v-if="!reps.data.value?.length" class="p-2 text-xs text-muted-foreground">
              Nenhum representante ainda — importe um relatório.
            </p>
          </div>
        </fieldset>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancelar" @click="aberto = false" />
        <UButton type="submit" form="form-usuario" label="Salvar" :loading="salvar.isPending.value" />
      </div>
    </template>
  </UModal>
</template>
