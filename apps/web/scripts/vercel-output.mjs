// Monta a publicação do site na Vercel (Build Output API v3) a partir do `nuxt generate` (.output/public):
// arquivos estáticos, cabeçalhos de segurança/CSP iguais aos do Caddy, /api/* encaminhado ao projeto da
// API (mesma origem: cookies e CSP continuam funcionando) e fallback da SPA.
// Uso (build da Vercel): NITRO_PRESET=static nuxt generate && node scripts/vercel-output.mjs
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CABECALHOS_SEGURANCA, hashesScriptsEmbutidos, politicaCsp } from './csp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const publico = join(raiz, '.output', 'public');
const saida = join(raiz, '.vercel', 'output');

const api = (process.env.API_ORIGIN ?? '').replace(/\/$/, '');
if (!/^https:\/\/[^/]+$/.test(api)) {
  console.error(
    'Defina API_ORIGIN (ex.: https://metabi-api.vercel.app) nas variáveis do projeto web na Vercel.',
  );
  process.exit(1);
}
if (!existsSync(join(publico, 'index.html'))) {
  console.error(`Não achei ${publico}/index.html — rode "nuxt generate" antes (com NITRO_PRESET=static).`);
  process.exit(1);
}

rmSync(saida, { recursive: true, force: true });
mkdirSync(join(saida, 'static'), { recursive: true });
cpSync(publico, join(saida, 'static'), { recursive: true });

const hashes = hashesScriptsEmbutidos(publico);
const fallback = existsSync(join(publico, '200.html')) ? '/200.html' : '/index.html';

const config = {
  version: 3,
  routes: [
    {
      src: '/(.*)',
      headers: { ...CABECALHOS_SEGURANCA, 'Content-Security-Policy': politicaCsp(hashes) },
      continue: true,
    },
    {
      src: '/_nuxt/(.*)',
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      continue: true,
    },
    // API no outro projeto da Vercel, servida como se fosse deste domínio.
    { src: '/api/(.*)', dest: `${api}/api/$1` },
    { handle: 'filesystem' },
    // SPA: qualquer rota que não seja arquivo abre o app.
    { src: '/(.*)', dest: fallback },
  ],
};
writeFileSync(join(saida, 'config.json'), JSON.stringify(config, null, 2));
console.log(
  `vercel-output: ${hashes.length} script(s) liberado(s) por hash · /api → ${api} · fallback ${fallback}`,
);
