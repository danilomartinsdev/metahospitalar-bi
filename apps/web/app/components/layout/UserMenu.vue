<script setup lang="ts">
import { KeyRound, LogOut } from 'lucide-vue-next';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();

const iniciais = computed(() =>
  (auth.usuario?.nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="flex items-center gap-3 rounded-lg p-1 pr-2 text-left hover:bg-accent focus-visible:outline-2"
      aria-label="Menu do usuário"
    >
      <Avatar class="size-8">
        <AvatarFallback class="bg-primary-soft text-xs font-semibold text-primary">{{
          iniciais
        }}</AvatarFallback>
      </Avatar>
      <span class="hidden leading-tight md:block">
        <span class="block text-sm font-medium">{{ auth.usuario?.nome }}</span>
        <span class="block text-xs text-muted-foreground">{{ auth.usuario?.papel.nome }}</span>
      </span>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-60">
      <DropdownMenuLabel class="font-normal">
        <span class="block text-sm font-medium">{{ auth.usuario?.nome }}</span>
        <span class="block truncate text-xs text-muted-foreground">{{ auth.usuario?.email }}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <NuxtLink to="/trocar-senha"><KeyRound class="size-4" /> Trocar senha</NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuItem @select="auth.logout()"><LogOut class="size-4" /> Sair</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
