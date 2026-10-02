import { useColorMode } from '@vueuse/core';

/** Tema claro/escuro/sistema; classe `dark` no <html>, preferência salva no navegador. */
export function useTheme() {
  const mode = useColorMode({ storageKey: 'meta-bi-tema', emitAuto: true });
  const isDark = computed(() => mode.state.value === 'dark');
  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark';
  }
  return { mode, isDark, toggle };
}
