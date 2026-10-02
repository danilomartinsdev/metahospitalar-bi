# ADR 0004 — PDF executivo gerado com Playwright

**Status:** aceito (2026-10-02)

## Contexto
O PDF deve ser "idêntico à tela": mesmos gráficos ECharts, tokens e tipografia. Bibliotecas de
PDF programático exigiriam reimplementar o layout e os gráficos.

## Decisão
A API gera um **token de impressão de uso único** (curta validade, vinculado ao usuário e aos
filtros), abre `/print/relatorio?token=...` da SPA em Chromium headless (Playwright) e usa
`page.pdf()` (A4, cabeçalho/rodapé com usuário, data e paginação). A rota de dados do print
aplica o mesmo escopo do usuário.

## Consequências
- Um único código de visualização para tela e PDF.
- Imagem Docker da API precisa do Chromium (maior); geração leva alguns segundos — aceitável
  para o volume. Concorrência limitada (1–2 páginas simultâneas).
- Token de impressão é auditado e invalidado após o uso.
