#!/usr/bin/env node
// SessionStart: imprime branch atual e o topo de docs/progresso.md (fase atual e pendências).
// O stdout de SessionStart é adicionado ao contexto do Claude.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readStdinJson, projectDir } from './lib.mjs';

const input = await readStdinJson();
const root = projectDir(input);

let branch = '(desconhecida)';
try {
  branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {
  /* git ausente ou fora de um repositório */
}

const out = [`Branch atual: ${branch}`];
const progresso = path.join(root, 'docs', 'progresso.md');
if (fs.existsSync(progresso)) {
  const lines = fs.readFileSync(progresso, 'utf8').split(/\r?\n/);
  // Tudo antes da seção "## Feito" (fase atual + pendências + decisões pendentes), no máximo 40 linhas.
  const end = lines.findIndex((l) => /^##\s+Feito/i.test(l));
  out.push('', '--- docs/progresso.md (resumo) ---', ...lines.slice(0, end === -1 ? 40 : Math.min(end, 40)));
}
process.stdout.write(out.join('\n').trim() + '\n');
