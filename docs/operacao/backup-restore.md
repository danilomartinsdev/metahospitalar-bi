# Backup e restauração

> Esqueleto — **a validar na Fase 6** com um restore real cronometrado.

## Backup
- Diário via `scripts/backup.sh` (cron no host): `pg_dump -Fc` do container para `backups/`
  com data no nome; retenção de 30 dias.
- Incluir o volume `storage/uploads` (arquivos originais das importações).
- Cópia off-site [PENDENTE: destino].

## Restore
`scripts/restore.sh <arquivo.dump>`: para a api, `pg_restore --clean --if-exists`, sobe a api,
valida contagens (pedidos, lotes, usuários) contra o relatório do backup.

## Teste de restore
Registrar aqui data, duração e resultado de cada teste.
