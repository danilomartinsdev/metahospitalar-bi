<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';

const auth = useAuthStore();
const router = useRouter();

const iniciais = computed(() =>
  (auth.usuario?.nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
);

const itens: DropdownMenuItem[][] = [
  [
    { type: 'label', label: auth.usuario?.nome ?? '?', class: 'font-normal' },
    {
      type: 'label',
      label: auth.usuario?.email ?? '',
      class: '-mt-2 truncate text-xs font-normal text-muted-foreground',
    },
  ],
  [
    {
      label: 'Trocar senha',
      icon: 'i-lucide-key-round',
      onSelect: () => router.push('/trocar-senha'),
    },
    {
      label: 'Sair',
      icon: 'i-lucide-log-out',
      onSelect: () => auth.logout(),
    },
  ],
];
</script>

<template>
  <UDropdownMenu :items="itens" :ui="{ content: 'w-60' }">
    <button
      type="button"
      aria-label="Menu do usuário"
      class="flex items-center gap-3 rounded-lg p-1 pr-2 text-left hover:bg-accent focus-visible:outline-2"
    >
      <Avatar class="size-8">
        <AvatarFallback class="bg-primary-soft text-xs font-semibold text-primary">{{
          iniciais
        }}</AvatarFallback>
      </Avatar>
      <span class="hidden leading-tight md:block">
        <span class="block text-sm font-medium">{{ auth.usuario?.nome }}</span>
        <span class="block truncate text-xs text-muted-foreground">{{ auth.usuario?.papel.nome }}</span>
      </span>
    </button>
  </UDropdownMenu>
</template>
