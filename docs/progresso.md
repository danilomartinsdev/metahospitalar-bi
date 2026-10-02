# Progresso

**Fase atual:** 2 — Dados (branch `fase-2-dados`)
**Concluídas:** 0 — Contexto · 1 — Fundação (branch `fase-1-fundacao`)

## Pendências

- [ ] **Planilha real** em `fixtures/focco/ano-todo-ate-agora.xls` (gitignored) — necessária para validar o importador.
- [ ] Gerar amostra anonimizada em `fixtures/focco/amostras/` a partir da planilha real.
- [ ] Rodar `/memory` e confirmar a hierarquia de contexto (comando interativo, usuário).
- [ ] Default branch do GitHub ainda é `fase-0-contexto` (trocar para `main` em Settings ou autenticar o `gh`).
- [ ] Subir a stack de produção (`docker-compose.prod.yml`) de ponta a ponta — imagens já compilam (Fase 6).
- [ ] Primeira execução da CI no GitHub.

## Decisões pendentes

Não implementar nada que dependa destes itens sem resposta do usuário.

1. **Status PDV (A, PE, AC):** significado de cada código e se pedidos **PE** contam no total vendido. Até a resposta, o cadastro de status terá a flag `contaNoTotal` configurável e os KPIs a respeitam.
2. **SMTP:** servidor e remetente para "esqueci minha senha".
3. **Escopo "por região":** um usuário com escopo de região vê todos os pedidos cuja UF pertence à região, independentemente do representante? (assumido sim, a confirmar)
4. **Visualizador × exportação:** padrão do papel Visualizador é sem exportação? (a permissão é configurável; falta o default)
5. **Segmento:** valores possíveis além de Público/Privado? Default de representante sem segmento?
6. **Metas por representante:** por valor apenas, ou também por quantidade de pedidos?
7. **Timeout de inatividade:** valor (sugestão: 30 min) e duração do refresh (sugestão: 7 dias); duração do bloqueio após 5 falhas (sugestão: 15 min).
8. **Propostas escritas nos docs na Fase 0, a confirmar:**
   - Cliente novo = 1º pedido dentro do período e nenhum antes; recorrência = nº de meses distintos com pedido.
   - Meta total cadastrada explicitamente (não é a soma das metas por representante); com filtro de gestor, a evolução usa a soma das metas dos gestores filtrados.
   - Importação com linhas inválidas: segue só com as válidas após confirmação explícita (alternativa: bloquear tudo).
   - Rollback só do lote mais recente que tocou cada pedido.
   - Status/representante desconhecidos na importação são criados automaticamente e sinalizados na prévia.
   - Matriz de papéis padrão em docs/arquitetura/seguranca-rbac.md (rollback para Gestor comercial, cadastros só Admin).

## Decisões tomadas

| Data       | Decisão                                                                                                                                                                                         | Onde                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 2026-10-02 | Gestor = Representante (mesma entidade; "Gestor" é o rótulo de UI)                                                                                                                              | glossario.md         |
| 2026-10-02 | Histórico 2025 vem do mesmo relatório Focco detalhado (importação normal)                                                                                                                       | regras-de-negocio.md |
| 2026-10-02 | Planilha real fica fora do git; só amostra anonimizada é versionada                                                                                                                             | importacao-focco.md  |
| 2026-10-02 | Agentes/skills do claude-code-templates instalados no `.claude/` do projeto                                                                                                                     | CLAUDE.md            |
| 2026-10-02 | Hooks do Claude Code em Node (.mjs), exec form                                                                                                                                                  | ADR 0005             |
| 2026-10-02 | Postgres sobe já na Fase 0 via `pnpm db:up` (pedido do usuário)                                                                                                                                 | docker-compose.yml   |
| 2026-10-02 | Projeto só JS/TS: scripts Python das skills removidos                                                                                                                                           | CLAUDE.md            |
| 2026-10-02 | Removidos por não se encaixarem: agentes data-scientist e context-manager; skills senior-frontend, senior-architect, senior-backend. `/security-audit` reescrito (lia `.env*` e usava npm/bash) | .claude/             |

## Feito

### Fase 1 — Fundação

- Monorepo pnpm (shared/api/web), TS estrito, ESLint/Prettier, pre-commit anti-segredos.
- API NestJS 12 + Prisma 7: schema completo, auth (argon2id, bloqueio, refresh rotativo com detecção de reuso,
  inatividade, troca obrigatória, esqueci/redefinir senha via Mailpit), guard seguro por padrão, auditoria.
- Web Nuxt 4 SPA: tokens light/dark, layout com sidebar, telas de autenticação, dashboard provisório.
- Testes: 8 shared + 6 web + 23 integração API (Postgres real) + 11 E2E (desktop e celular).
- Docker de produção (API, Caddy com SPA e CSP) e CI no GitHub Actions. Ajustes de versão: ADR 0006.

**Como testar:** `pnpm db:up` · `pnpm dev` → http://localhost:4317 · `pnpm test` · `pnpm test:e2e`.

### Fase 0 — Contexto

- CLAUDE.md raiz e por pacote, REVIEW.md, README.md, .gitignore, .env.example, pnpm-workspace.yaml.
- `.claude/`: settings.json (permissões + hooks), 8 rules, 3 skills do projeto, agente `revisor-rbac`,
  hooks Node (`protect-paths`, `format`, `session-context`) com testes.
- Instalados do claude-code-templates: agentes context-manager, vue-expert, fullstack-developer,
  data-analyst, data-scientist, test-engineer, security-auditor; skills senior-architect,
  senior-frontend, senior-backend, frontend-design, ui-ux-pro-max; comando /security-audit.
  `code-review` usa o comando nativo do Claude Code.
- docs/ completo (produto, dados, arquitetura, ADRs 0001–0005, design, operação em esqueleto).
- Logos baixados em `apps/web/public/brand/`.
- docker-compose.yml com Postgres 16 (127.0.0.1:5517, volume `meta-bi_pgdata`).

**Como testar**

- `pnpm hooks:test` — testes dos hooks.
- Pedir ao Claude para escrever em `.env` → deve ser bloqueado pelo hook.
- `pnpm db:up` → container `meta-bi-postgres` healthy; `pnpm db:down` para parar.
- `/memory` → CLAUDE.md raiz, glossário importado, rules `seguranca` e `git` sempre carregadas.

**Observações**

- `pnpm lint`/`typecheck`/`test` ainda não existem: não há código de aplicação (Fase 1).
- Git Bash desta máquina falha ao iniciar; por isso hooks em Node e comandos via PowerShell.
