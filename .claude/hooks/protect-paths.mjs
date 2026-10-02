#!/usr/bin/env node
// PreToolUse (Edit|Write): bloqueia .env* e migrations Prisma já existentes.
// Exit 2 + stderr = ferramenta bloqueada e motivo devolvido ao Claude.
import { readStdinJson, projectDir, checkProtectedPath } from './lib.mjs';

const input = await readStdinJson();
const reason = checkProtectedPath(input?.tool_input?.file_path, projectDir(input));
if (reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}
