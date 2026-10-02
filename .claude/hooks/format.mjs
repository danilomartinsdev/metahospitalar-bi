#!/usr/bin/env node
// PostToolUse (Edit|Write): prettier --write e eslint --fix só no arquivo editado.
// Silencioso em sucesso; no-op se as ferramentas ainda não estiverem instaladas.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readStdinJson, projectDir } from './lib.mjs';

const PRETTIER_EXT = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.vue', '.json', '.css', '.md', '.yaml', '.yml', '.html']);
const ESLINT_EXT = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.vue']);

function bin(root, name) {
  const p = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
  return fs.existsSync(p) ? p : null;
}

function run(cmd, args, root) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0 ? null : (r.stderr || r.stdout || '').trim();
}

const input = await readStdinJson();
const filePath = input?.tool_input?.file_path;
const root = projectDir(input);
if (!filePath || !fs.existsSync(filePath)) process.exit(0);

const abs = path.resolve(root, filePath);
if (abs.includes(`${path.sep}node_modules${path.sep}`)) process.exit(0);
const ext = path.extname(abs).toLowerCase();
const problems = [];

const prettier = bin(root, 'prettier');
if (prettier && PRETTIER_EXT.has(ext)) {
  const err = run(prettier, ['--write', '--log-level', 'warn', abs], root);
  if (err) problems.push(`prettier: ${err}`);
}

const eslint = bin(root, 'eslint');
if (eslint && ESLINT_EXT.has(ext)) {
  const err = run(eslint, ['--fix', '--no-warn-ignored', abs], root);
  if (err) problems.push(`eslint: ${err}`);
}

if (problems.length) {
  // Exit 2 no PostToolUse devolve o stderr ao Claude para ele corrigir (a edição já foi feita).
  process.stderr.write(problems.join('\n').slice(0, 4000) + '\n');
  process.exit(2);
}
process.exit(0);
