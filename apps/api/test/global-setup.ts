import { execSync } from 'node:child_process';
import path from 'node:path';
import { prepararEnvDeTeste } from './env-test.js';

/** Aplica as migrations no banco de teste antes da suíte. */
export default function setup() {
  prepararEnvDeTeste();
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: process.env,
    stdio: 'pipe',
  });
}
