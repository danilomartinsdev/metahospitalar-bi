import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const envFile = path.resolve(import.meta.dirname, '../../.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

// E2E em portas próprias e no banco de TESTE (DATABASE_URL_TEST), sem afetar o ambiente de dev.
const WEB_PORT = 4327;
const API_PORT = 4328;
const WEB_URL = `http://localhost:${WEB_PORT}`;

const envApi = {
  ...process.env,
  NODE_ENV: 'test',
  API_PORT: String(API_PORT),
  WEB_ORIGIN: WEB_URL,
  APP_URL: WEB_URL,
  ...(process.env.DATABASE_URL_TEST ? { DATABASE_URL: process.env.DATABASE_URL_TEST } : {}),
} as Record<string, string>;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  // O servidor de dev compila sob demanda: o primeiro carregamento de cada rota é lento (~20s
  // após mudanças de config/dep). Testes desktop 1 a 3 morriam por 30s no cold start.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: WEB_URL, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      // Compila em dist-e2e/ para não apagar o dist/ do servidor de dev que pode estar rodando.
      command: 'pnpm --filter api exec nest start -p tsconfig.e2e.json --env-file ../../.env',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: envApi,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `pnpm exec nuxt dev --port ${WEB_PORT}`,
      url: `${WEB_URL}/login`,
      env: {
        ...process.env,
        API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`,
        NUXT_BUILD_DIR: '.nuxt-e2e',
      } as Record<string, string>,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
