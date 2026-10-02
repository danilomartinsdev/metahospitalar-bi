# Deploy

> Esqueleto — **a validar na Fase 6** com execução real do checklist.

## Topologia
Um servidor Linux com Docker Compose: `postgres`, `api`, `web` (Caddy servindo a SPA, HTTPS
automático e proxy `/api`). Volumes: `pgdata`, `storage` (uploads), `backups`.

## Hoje (Fase 0)
Só o Postgres de desenvolvimento: `pnpm db:up` / `pnpm db:down`
(container `meta-bi-postgres`, `127.0.0.1:5517`, volume `meta-bi_pgdata`).

## Checklist de deploy (rascunho)
- [ ] DNS apontando para o servidor; portas 80/443 liberadas.
- [ ] `.env` de produção criado a partir de `.env.example` (segredos fortes, `WEB_ORIGIN` correto).
- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
- [ ] Migrations: `docker compose exec api pnpm db:migrate:deploy`
- [ ] Seed do admin inicial; troca de senha no primeiro acesso.
- [ ] Backup diário agendado e restore testado (ver backup-restore.md).
- [ ] Healthchecks verdes; login, importação e PDF testados em produção.
