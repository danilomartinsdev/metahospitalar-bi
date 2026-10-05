// Gera o Caddyfile final com os hashes (sha256) dos scripts embutidos que o `nuxt generate` coloca no HTML.
// A lógica é a mesma usada na Vercel (apps/web/scripts/csp.mjs).
// Uso: node docker/csp-hashes.mjs <pasta-public> <Caddyfile-modelo>  > Caddyfile
import { readFileSync } from 'node:fs';
import { hashesScriptsEmbutidos } from '../apps/web/scripts/csp.mjs';

const [pasta, modelo] = process.argv.slice(2);
if (!pasta || !modelo) {
  console.error('Uso: node docker/csp-hashes.mjs <pasta-public> <Caddyfile-modelo>');
  process.exit(1);
}
const hashes = hashesScriptsEmbutidos(pasta);
const caddy = readFileSync(modelo, 'utf8');
if (!caddy.includes('__CSP_SCRIPT_HASHES__')) {
  console.error('O Caddyfile modelo não tem o marcador __CSP_SCRIPT_HASHES__.');
  process.exit(1);
}
console.error(`csp-hashes: ${hashes.length} script(s) embutido(s) liberado(s) por hash.`);
process.stdout.write(caddy.replace('__CSP_SCRIPT_HASHES__', hashes.join(' ')));
