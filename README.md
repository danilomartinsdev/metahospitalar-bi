# Meta Hospitalar — BI Executivo

BI comercial interno da Meta Hospitalar (Aparecida de Goiânia/GO). Importa o relatório
"DASHBOARD_Extrator PDV" do ERP Focco3i e apresenta KPIs, rankings e comparativos,
com login, controle de acesso por papel e exportação para Excel/PDF.

> Estado atual: **Fase 0 — estrutura de contexto**. O código da aplicação começa na Fase 1.
> Veja [docs/progresso.md](docs/progresso.md).

## Requisitos
- Node.js 24+ e pnpm (via Corepack: `corepack enable`)
- Docker + Docker Compose

## Setup (a partir da Fase 1)
```bash
pnpm install
cp .env.example .env      # preencha os valores
pnpm db:up                # Postgres em container
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev                  # web em :3000, api em :3001
```

## Scripts
| Comando | O que faz |
|---|---|
| `pnpm dev` | web + api em modo dev |
| `pnpm lint` / `pnpm typecheck` | qualidade estática |
| `pnpm test` / `pnpm test:e2e` | Vitest / Playwright |
| `pnpm db:up` / `pnpm db:down` | sobe/derruba o Postgres |

## Documentação
Índice em [docs/README.md](docs/README.md). Deploy, backup e restauração em `docs/operacao/`.
