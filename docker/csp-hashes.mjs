// Gera o Caddyfile final com os hashes (sha256) dos scripts embutidos que o `nuxt generate` coloca no HTML.
// Sem isso a CSP `script-src 'self'` bloqueia esses scripts e a SPA abre em branco; com os hashes,
// só exatamente esses scripts são liberados (nada de 'unsafe-inline').
// Uso: node docker/csp-hashes.mjs <pasta-public> <Caddyfile-modelo>  > Caddyfile
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [pasta, modelo] = process.argv.slice(2);
if (!pasta || !modelo) {
  console.error('Uso: node docker/csp-hashes.mjs <pasta-public> <Caddyfile-modelo>');
  process.exit(1);
}

const hashes = new Set();
for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(pasta, arquivo), 'utf8');
  for (const [, attrs, conteudo] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    // Scripts externos (src) já são cobertos por 'self'; blocos de dados (JSON) não executam.
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || !conteudo.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(conteudo, 'utf8').digest('base64')}'`);
  }
}

const caddy = readFileSync(modelo, 'utf8');
if (!caddy.includes('__CSP_SCRIPT_HASHES__')) {
  console.error('O Caddyfile modelo não tem o marcador __CSP_SCRIPT_HASHES__.');
  process.exit(1);
}
console.error(`csp-hashes: ${hashes.size} script(s) embutido(s) liberado(s) por hash.`);
process.stdout.write(caddy.replace('__CSP_SCRIPT_HASHES__', [...hashes].join(' ')));
