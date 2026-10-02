<script setup lang="ts">
import { REGIAO_ENUM_ROTULO, type UsuarioAdmin } from '@meta-bi/shared';
import { Copy, KeyRound, LogOut, MoreHorizontal, Pencil, Plus, UserCheck, UserX } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { ApiError } from '~/composables/api/useApi';
import { useAcaoUsuario, useUsuariosQuery } from '~/composables/api/useAdmin';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ titulo: 'Usuários', permissao: 'users.manage' });
useHead({ title: 'Usuários — BI Meta Hospitalar' });

const auth = useAuthStore();
const usuarios = useUsuariosQuery();
const acao = useAcaoUsuario();

const dialogo = ref(false);
const editando = ref<UsuarioAdmin | null>(null);
const credencial = ref<{ email: string; senha: string } | null>(null);

function abrir(u: UsuarioAdmin | null) {
  editando.value = u;
  dialogo.value = true;
}

async function executar(
  u: UsuarioAdmin,
  tipo: 'desativar' | 'reativar' | 'derrubar-sessoes' | 'redefinir-senha',
) {
  const textos = {
    desativar: `Desativar ${u.nome}? Ele perde o acesso imediatamente.`,
    reativar: null,
    'derrubar-sessoes': `Encerrar todas as sessões de ${u.nome}? Ele precisará entrar de novo.`,
    'redefinir-senha': `Gerar uma nova senha provisória para ${u.nome}? As sessões dele serão encerradas.`,
  } as const;
  if (textos[tipo] && !confirm(textos[tipo]!)) return;
  try {
    const r = await acao.mutateAsync({ id: u.id, acao: tipo });
    if (tipo === 'redefinir-senha' && r?.senhaProvisoria)
      credencial.value = { email: u.email, senha: r.senhaProvisoria };
    else toast.success('Feito.');
  } catch (e) {
    toast.error((e as ApiError).message);
  }
}

function copiar() {
  if (!credencial.value) return;
  void navigator.clipboard.writeText(credencial.value.senha);
  toast.success('Senha copiada.');
}

const escopo = (u: UsuarioAdmin) =>
  u.escopoTipo === 'todos'
    ? 'Todos'
    : u.escopoTipo === 'regiao'
      ? u.escopoRegioes.map((r) => REGIAO_ENUM_ROTULO[r]).join(', ') || '—'
      : u.representantes.map((r) => r.nomeExibicao).join(', ') || 'Nenhum representante';
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <UiExtraPageHeader titulo="Usuários" descricao="Quem acessa o BI, com qual papel e quais dados pode ver.">
      <Button @click="abrir(null)"><Plus /> Novo usuário</Button>
    </UiExtraPageHeader>

    <section class="rounded-xl border bg-card">
      <UiExtraEstadoBloco
        :carregando="usuarios.isPending.value"
        :erro="usuarios.error.value"
        @tentar-de-novo="usuarios.refetch()"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Usuário</th>
                <th class="px-3 py-3 font-medium">Papel</th>
                <th class="px-3 py-3 font-medium">Escopo</th>
                <th class="px-3 py-3 font-medium">Último acesso</th>
                <th class="px-3 py-3 font-medium">Situação</th>
                <th class="px-5 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="u in usuarios.data.value" :key="u.id" :class="!u.ativo && 'opacity-60'">
                <td class="px-5 py-3">
                  <span class="block font-medium">{{ u.nome }}</span>
                  <span class="block text-xs text-muted-foreground">{{ u.email }}</span>
                </td>
                <td class="px-3 py-3">{{ u.papel.nome }}</td>
                <td class="max-w-64 truncate px-3 py-3" :title="escopo(u)">{{ escopo(u) }}</td>
                <td class="num whitespace-nowrap px-3 py-3">{{ formatDateTime(u.ultimoAcessoEm) }}</td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1">
                    <Badge v-if="!u.ativo" variant="secondary">Desativado</Badge>
                    <Badge v-else-if="u.bloqueado" class="bg-warning/15 text-warning">Bloqueado</Badge>
                    <Badge v-else class="bg-success/15 text-success">Ativo</Badge>
                    <Badge v-if="u.trocarSenha && u.ativo" variant="outline">Troca de senha</Badge>
                  </div>
                </td>
                <td class="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm" :aria-label="`Ações para ${u.nome}`"
                        ><MoreHorizontal
                      /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @select="abrir(u)"><Pencil /> Editar</DropdownMenuItem>
                      <DropdownMenuItem @select="executar(u, 'redefinir-senha')"
                        ><KeyRound /> Redefinir senha</DropdownMenuItem
                      >
                      <DropdownMenuItem @select="executar(u, 'derrubar-sessoes')"
                        ><LogOut /> Encerrar sessões</DropdownMenuItem
                      >
                      <template v-if="u.id !== auth.usuario?.id">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          v-if="u.ativo"
                          class="text-danger"
                          @select="executar(u, 'desativar')"
                          ><UserX /> Desativar</DropdownMenuItem
                        >
                        <DropdownMenuItem v-else @select="executar(u, 'reativar')"
                          ><UserCheck /> Reativar</DropdownMenuItem
                        >
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiExtraEstadoBloco>
    </section>

    <AdminUsuarioDialog
      v-model:aberto="dialogo"
      :usuario="editando"
      @criado="(email, senha) => (credencial = { email, senha })"
    />

    <Dialog :open="!!credencial" @update:open="(v) => !v && (credencial = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Senha provisória</DialogTitle>
          <DialogDescription
            >Envie ao usuário por um canal seguro. Ela não será mostrada de novo e precisa ser trocada no
            primeiro acesso.</DialogDescription
          >
        </DialogHeader>
        <div class="space-y-2 rounded-lg border bg-muted/40 p-4">
          <p class="text-sm"><span class="text-muted-foreground">E-mail:</span> {{ credencial?.email }}</p>
          <p class="flex items-center justify-between gap-2">
            <code class="num rounded bg-background px-2 py-1 text-base font-semibold">{{
              credencial?.senha
            }}</code>
            <Button variant="outline" size="sm" @click="copiar"><Copy /> Copiar</Button>
          </p>
        </div>
        <DialogFooter><Button @click="credencial = null">Entendi</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
