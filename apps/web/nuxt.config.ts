import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4318';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'shadcn-nuxt', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  // Usa o código-fonte do pacote compartilhado (sem depender do build em dist/ durante o dev).
  alias: { '@meta-bi/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)) },
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  fonts: { families: [{ name: 'Inter', provider: 'google', weights: [400, 500, 600] }] },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'BI Meta Hospitalar',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/brand/icone-meta.png' }],
    },
  },
  // Em dev, /api é repassado à API Nest (em produção quem faz isso é o Caddy).
  nitro: { devProxy: { '/api': { target: `${apiTarget}/api`, changeOrigin: true } } },
  typescript: { strict: true },
});
