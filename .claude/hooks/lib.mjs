// Utilitários compartilhados pelos hooks (Node puro, sem dependências).
import fs from 'node:fs';
import path from 'node:path';

export async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function projectDir(input = {}) {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
}

/** Caminho relativo à raiz do projeto, com "/" como separador. */
export function relativeToProject(filePath, root) {
  const abs = path.resolve(root, filePath);
  return path.relative(root, abs).split(path.sep).join('/');
}

/** Regra do protect-paths: devolve o motivo do bloqueio ou null. */
export function checkProtectedPath(filePath, root, exists = fs.existsSync) {
  if (!filePath) return null;
  const rel = relativeToProject(filePath, root);
  const base = path.posix.basename(rel);

  if (/^\.env(\..*)?$/i.test(base) && base.toLowerCase() !== '.env.example') {
    return `Bloqueado: "${rel}" contém segredos. Edite .env.example e peça ao usuário para ajustar o .env.`;
  }

  if (/(^|\/)apps\/api\/prisma\/migrations\//.test(rel) && exists(path.resolve(root, filePath))) {
    return `Bloqueado: "${rel}" é uma migration existente. Não edite migrations aplicadas; crie uma nova com "pnpm --filter api db:migrate".`;
  }
  return null;
}
