---
allowed-tools: Read, Grep, Glob, Bash(pnpm audit *), Bash(git log *), PowerShell(pnpm audit *), PowerShell(git log *)
argument-hint: [area] | --full
description: Auditoria de segurança do projeto (dependências, auth, RBAC/escopo, entrada, segredos, infra)
---

# Auditoria de segurança

Foco: $ARGUMENTS (sem argumento = projeto inteiro)

NUNCA leia `.env` ou arquivos de segredo — use `.env.example` para saber quais variáveis existem.
Referências: `docs/arquitetura/seguranca-rbac.md`, `.claude/rules/seguranca.md`, `REVIEW.md`.

## Passos

1. **Dependências:** rode `pnpm audit --prod` e `pnpm audit`; liste vulnerabilidades altas/críticas com o caminho da dependência.
2. **Autenticação:** argon2id, bloqueio após falhas, refresh rotativo com detecção de reuso, cookie httpOnly/secure/sameSite, expiração por inatividade, tokens nunca em localStorage, resposta neutra no "esqueci a senha".
3. **Autorização e escopo:** todo endpoint com `@RequirePermission` (ou `@Public` explícito); pedidos só via `ScopedPedidosRepository`; export, dashboard e /print respeitam o escopo; IDs do cliente checados contra o escopo. Para uma revisão profunda, use o subagente `revisor-rbac`.
4. **Entrada:** Zod em body/query/params; upload com validação de conteúdo real, limite de tamanho, fora do webroot.
5. **Segredos:** procure segredos hardcoded (Grep por `password=`, `secret`, `BEGIN PRIVATE KEY`, tokens); confira `.gitignore`.
6. **Erros e logs:** sem stack/SQL na resposta; logs sem senha, token ou conteúdo de planilha.
7. **HTTP:** Helmet/CSP, CORS restrito a `WEB_ORIGIN`, rate limit (mais rígido em /auth), atributos de cookie.
8. **Infra:** Dockerfiles (usuário não-root, imagem mínima), docker-compose (portas expostas só em 127.0.0.1 em dev), CI (permissões mínimas, sem segredos em log).

## Relatório

Achados por severidade (Crítico, Alto, Médio, Baixo), cada um com `arquivo:linha`, impacto e correção sugerida.
Termine com um resumo executivo e o que foi verificado sem achados. Não edite arquivos.
