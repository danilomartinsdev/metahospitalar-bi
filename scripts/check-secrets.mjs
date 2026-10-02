#!/usr/bin/env node
// Barra commits com arquivos proibidos ou segredos.
//   node scripts/check-secrets.mjs          → arquivos staged (pre-commit)
//   node scripts/check-secrets.mjs --all    → todos os arquivos versionados (CI)
// Falso positivo legítimo: acrescente "secret-scan:ignore" na linha.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const all = process.argv.includes('--all');
const git = (args) => execFileSync('git', args, { encoding: 'utf8' });
const files = (all ? git(['ls-files']) : git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']))
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean);

/** Arquivos que nunca devem ser versionados. */
const FORBIDDEN_FILES = [
  {
    test: (f) => /^\.env(\..+)?$/.test(path.posix.basename(f)) && path.posix.basename(f) !== '.env.example',
    why: 'arquivo .env com segredos',
  },
  {
    test: (f) => /\.(pem|key|p12|pfx|dump|backup)$/i.test(f) || /(^|\/)id_(rsa|ed25519)$/.test(f),
    why: 'chave privada ou dump',
  },
  { test: (f) => /\.sql\.gz$/i.test(f) || f.startsWith('backups/'), why: 'backup de banco' },
  {
    test: (f) =>
      f.startsWith('fixtures/focco/') &&
      !f.startsWith('fixtures/focco/amostras/') &&
      f !== 'fixtures/focco/README.md',
    why: 'planilha real do Focco (dados de clientes) — use fixtures/focco/amostras/ anonimizado',
  },
  { test: (f) => /^(storage|uploads)\//.test(f), why: 'arquivo enviado por usuário' },
];

/** Valores de exemplo de documentação — não são segredos. */
const EXAMPLE = String.raw`(?:postgres|password|example|changeme|secret|test)\b`;

/** Padrões de segredo no conteúdo. */
const SECRET_PATTERNS = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: 'chave privada' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, why: 'AWS access key' },
  { re: /\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/, why: 'token GitHub' },
  { re: /\bsk-(ant-)?[A-Za-z0-9_-]{24,}/, why: 'chave de API' },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, why: 'token Slack' },
  {
    re: new RegExp(
      String.raw`postgres(?:ql)?://[^:\s/]+:(?!__POSTGRES_PASSWORD__|\$\{|\$\$|<|${EXAMPLE}@)[^@\s]{4,}@`,
    ),
    why: 'URL de banco com senha',
  },
  {
    re: new RegExp(
      // Valor literal (termina em espaço, aspas, vírgula ou fim de linha) — ignora código como `z.string()`.
      String.raw`\b(JWT_ACCESS_SECRET|POSTGRES_PASSWORD|SMTP_PASSWORD)\s*[=:]\s*['"]?(?!__GERADO__|\$\{|\$\$|${EXAMPLE})[^\s'"()]{8,}(?=['"\s,;]|$)`,
    ),
    why: 'segredo de ambiente com valor',
  },
];

const BINARY = /\.(png|jpe?g|webp|gif|ico|pdf|xlsx?|woff2?|ttf|zip)$/i;
const problems = [];

for (const f of files) {
  for (const rule of FORBIDDEN_FILES) if (rule.test(f)) problems.push(`${f}: ${rule.why}`);
  if (BINARY.test(f) || !fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('secret-scan:ignore')) return;
    for (const p of SECRET_PATTERNS) if (p.re.test(line)) problems.push(`${f}:${i + 1}: possível ${p.why}`);
  });
}

if (problems.length) {
  console.error('✖ Verificação de segredos falhou:\n  ' + problems.join('\n  '));
  console.error('\nRemova o arquivo/segredo do commit (git restore --staged <arquivo>).');
  process.exit(1);
}
console.log(`✔ Verificação de segredos: ${files.length} arquivo(s) ok.`);
