<script setup lang="ts">
import { NAV } from './nav';

defineProps<{ recolhida?: boolean }>();
const emit = defineEmits<{ navegou: [] }>();

const can = useCan();
const route = useRoute();

const grupos = computed(() =>
  NAV.map((g) => ({ ...g, itens: g.itens.filter((i) => can(i.permissao)) })).filter((g) => g.itens.length),
);

function ativo(to: string) {
  return to === '/dashboard' ? route.path === to : route.path.startsWith(to);
}
</script>

<template>
  <nav
    aria-label="Navegação principal"
    class="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground"
  >
    <NuxtLink
      to="/dashboard"
      class="flex h-16 shrink-0 items-center justify-center gap-3 border-b border-sidebar-border"
      :class="recolhida ? 'px-2' : 'px-4'"
      @click="emit('navegou')"
    >
      <img
        v-if="recolhida"
        src="/brand/icone-meta-recortado.png"
        alt="Meta Hospitalar"
        class="h-3.5 w-auto shrink-0 brightness-0 invert"
      />
      <img
        v-else
        src="/brand/logo-meta-hospitalar.webp"
        alt="Meta Hospitalar"
        class="h-8 w-auto brightness-0 invert"
      />
    </NuxtLink>

    <div class="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      <div v-for="g in grupos" :key="g.titulo">
        <p
          v-if="!recolhida"
          class="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted"
        >
          {{ g.titulo }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in g.itens" :key="item.to">
            <UTooltip
              :text="item.label"
              :content="{ side: 'right' }"
              :delay-duration="0"
              :disabled="!recolhida"
            >
              <NuxtLink
                :to="item.to"
                :aria-current="ativo(item.to) ? 'page' : undefined"
                class="flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-sidebar-active"
                :class="[
                  ativo(item.to)
                    ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                    : 'text-sidebar-foreground/85',
                  recolhida && 'justify-center px-0',
                ]"
                @click="emit('navegou')"
              >
                <component :is="item.icon" class="size-[18px] shrink-0" aria-hidden="true" />
                <span v-if="!recolhida" class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="!recolhida && item.fase"
                  class="rounded-full bg-sidebar-active px-2 py-0.5 text-[10px] text-sidebar-muted"
                >
                  em breve
                </span>
              </NuxtLink>
            </UTooltip>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
