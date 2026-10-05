import { aplicarPaletaNoCss } from '~/utils/charts/palette';

/** Mantém as variáveis CSS das cores dos gráficos (tabelas comparativas) em dia com a paleta e o tema. */
export default defineNuxtPlugin(() => {
  const paleta = usePaletaGraficos();
  const { isDark } = useTheme();
  watch([paleta, isDark], ([p, escuro]) => nextTick(() => aplicarPaletaNoCss(p, escuro)), {
    immediate: true,
  });
});
