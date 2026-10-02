// Único lugar com cores de gráfico além de tokens.css (docs/design/design-system.md).
export const PALETA_CATEGORICA = [
  '#1D5FA8',
  '#0D9488',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
  '#84CC16',
];

/** Cores do tema atual lidas dos tokens CSS (fallback para o tema claro, ex.: em testes). */
export interface TemaGrafico {
  texto: string;
  textoSuave: string;
  borda: string;
  fundo: string;
  primaria: string;
  destaque: string;
  categorica: string[];
}

export const TEMA_CLARO: TemaGrafico = {
  texto: '#0F172A',
  textoSuave: '#64748B',
  borda: '#E2E8F0',
  fundo: '#FFFFFF',
  primaria: '#1D5FA8',
  destaque: '#0D9488',
  categorica: PALETA_CATEGORICA,
};

export function lerTema(): TemaGrafico {
  if (typeof window === 'undefined') return TEMA_CLARO;
  const css = getComputedStyle(document.documentElement);
  const v = (nome: string, fb: string) => css.getPropertyValue(nome).trim() || fb;
  return {
    texto: v('--foreground', TEMA_CLARO.texto),
    textoSuave: v('--muted-foreground', TEMA_CLARO.textoSuave),
    borda: v('--border', TEMA_CLARO.borda),
    fundo: v('--card', TEMA_CLARO.fundo),
    primaria: v('--primary', TEMA_CLARO.primaria),
    destaque: v('--highlight', TEMA_CLARO.destaque),
    categorica: PALETA_CATEGORICA,
  };
}
