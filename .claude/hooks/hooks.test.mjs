// Testes dos hooks: `pnpm hooks:test` (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkProtectedPath } from './lib.mjs';

const root = path.resolve('/projeto');
const always = () => true;
const never = () => false;

test('bloqueia .env e variantes, em qualquer pasta', () => {
  for (const f of ['.env', '.env.local', '.env.production', 'apps/api/.env', path.join(root, 'apps', 'web', '.env')]) {
    assert.match(checkProtectedPath(f, root, never) ?? '', /segredos/, f);
  }
});

test('permite .env.example e arquivos comuns', () => {
  for (const f of ['.env.example', 'apps/api/.env.example', 'README.md', 'apps/api/src/main.ts', 'environment.ts']) {
    assert.equal(checkProtectedPath(f, root, never), null, f);
  }
});

test('bloqueia migration existente e permite migration nova', () => {
  const mig = 'apps/api/prisma/migrations/20260101000000_init/migration.sql';
  assert.match(checkProtectedPath(mig, root, always) ?? '', /migration existente/);
  assert.equal(checkProtectedPath(mig, root, never), null);
  assert.equal(checkProtectedPath('apps/api/prisma/schema.prisma', root, always), null);
});

test('processo: exit 2 com stderr para .env, exit 0 para arquivo comum', () => {
  const script = fileURLToPath(new URL('./protect-paths.mjs', import.meta.url));
  const run = (file_path) =>
    spawnSync(process.execPath, [script], { input: JSON.stringify({ tool_input: { file_path } }), encoding: 'utf8' });
  const blocked = run('.env');
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /Bloqueado/);
  assert.equal(run('docs/README.md').status, 0);
});
