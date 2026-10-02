# Runbook

> Problemas comuns e como resolver. Cresce a cada incidente.

| Sintoma | Causa provável | Ação |
|---|---|---|
| `pnpm db:up` falha com porta 5432 em uso | Outro Postgres local | Defina `POSTGRES_PORT=5433` no `.env` e ajuste `DATABASE_URL` |
| Hooks do Claude Code não rodam no Windows | Git Bash quebrado | Hooks usam exec form com `node` (ADR 0005); verifique `node -v` |
| Usuário bloqueado após 5 tentativas | Bloqueio de login | Aguardar ou admin desbloqueia em /admin/usuarios |
| Importação "formato não reconhecido" | Arquivo não é xls/xlsx/csv/HTML | Reexportar do Focco; ver docs/dados/importacao-focco.md |
| Rollback recusado (409) | Lote posterior alterou os mesmos pedidos | Reverter primeiro o lote mais recente |
