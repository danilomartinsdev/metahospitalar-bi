# ADR 0005 — Hooks do Claude Code em Node (.mjs), exec form

**Status:** aceito (2026-10-02)

## Contexto
A especificação previa hooks em shell (`.sh` com `jq`). Na máquina de desenvolvimento (Windows)
o Git Bash falha ao iniciar e `jq` não está instalado; o Claude Code no Windows executa hooks em
forma de shell via Git Bash quando ele existe.

## Decisão
Hooks escritos como scripts Node ESM sem dependências em `.claude/hooks/*.mjs`, registrados em
`.claude/settings.json` na **exec form** (`"command": "node"`, `"args": ["${CLAUDE_PROJECT_DIR}/..."]`),
que não passa por shell. Lógica testável isolada em `lib.mjs`, testes com `node --test`
(`pnpm hooks:test`).

## Consequências
- Funciona igual em Windows, Linux e CI; só exige Node (já obrigatório no projeto).
- Mudanças em hooks exigem rodar `pnpm hooks:test`.
