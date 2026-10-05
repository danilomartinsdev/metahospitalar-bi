// Cabeçalhos de segurança do site e hashes da CSP — fonte única para o Docker (Caddyfile) e a Vercel.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Hashes sha256 dos scripts embutidos que o `nuxt generate` coloca no HTML. Com eles a CSP libera só
 * exatamente esses scripts (sem 'unsafe-inline'); sem eles a SPA abre em branco.
 */
export function hashesScriptsEmbutidos(pasta) {
  const hashes = new Set();
  for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(pasta, arquivo), 'utf8');
    for (const [, attrs, conteudo] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      // Scripts externos (src) já são cobertos por 'self'; blocos de dados (JSON) não executam.
      if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || !conteudo.trim()) continue;
      hashes.add(`'sha256-${createHash('sha256').update(conteudo, 'utf8').digest('base64')}'`);
    }
  }
  return [...hashes];
}

/** CSP do site (mesma do Caddyfile), com os hashes dos scripts embutidos. */
export function politicaCsp(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

export const CABECALHOS_SEGURANCA = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
