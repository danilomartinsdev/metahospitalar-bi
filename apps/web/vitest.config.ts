import { defineConfig } from 'vitest/config';

// Testes unitários de funções puras (utils/, utils/charts/). E2E fica no Playwright (e2e/).
export default defineConfig({
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'America/Sao_Paulo' },
  },
});
