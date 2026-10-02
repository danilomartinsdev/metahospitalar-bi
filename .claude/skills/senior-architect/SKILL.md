---
name: senior-architect
description: Apoio a decisões de arquitetura (padrões, trade-offs, diagramas, análise de dependências). Use ao planejar uma fase, avaliar alternativas técnicas ou escrever um ADR.
---

# Senior Architect

Arquitetura do projeto: `docs/arquitetura/visao-geral.md` e ADRs em `docs/arquitetura/adr/`.
Toda decisão arquitetural nova vira um ADR curto (Status, Contexto, Decisão, Consequências).

## Referências
- `references/architecture_patterns.md` — padrões (monólito modular, camadas, eventos).
- `references/system_design_workflows.md` — roteiro de design de sistema.
- `references/tech_decision_guide.md` — como comparar alternativas e registrar trade-offs.

## Diagramas
Use Mermaid dentro dos .md (flowchart, sequenceDiagram, erDiagram) — renderiza no GitHub.

## Restrições do projeto
Só ecossistema JavaScript/TypeScript (Node, Vue/Nuxt, NestJS). Sem Python. Sem Redis, filas ou
microsserviços na v1.
