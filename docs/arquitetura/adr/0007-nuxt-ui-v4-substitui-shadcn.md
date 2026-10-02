# ADR 0007 — Nuxt UI v4 substitui shadcn-vue na camada de componentes

**Status:** aceito (2026-10-02)

## Contexto

O frontend usa shadcn-vue (75 arquivos gerados em `components/ui`, 9 grupos em uso) desde a
Fase 1. Um refinamento de UI nas telas de administração e na navegação revelou que parte dos
componentes gerados nunca foi adotada (select, table, switch, tooltip, card, separator,
skeleton) — tabelas, selects, switches e tooltips foram feitos à mão em cada tela, com
densidades e padrões inconsistentes, `confirm()`/`prompt()` nativos em ações destrutivas e
erros de mutação sem mensagem concreta.

O Nuxt UI v4 (que fundiu o antigo Nuxt UI Pro, MIT) oferecia: shell de dashboard pronto
(`UDashboardGroup/Sidebar/Navbar` com recolha persistida e slide-over mobile), `UTable`
(TanStack Table v8, com ordenação), `UForm/`UFormField`com validação Standard Schema (Zod 4
direto, eliminando o adaptador`utils/zod-form.ts`do ADR 0006), toasts integrados (fim do
vue-sonner), locale pt-BR nativo e color-mode com`@nuxtjs/color-mode`.

Ambas as bibliotecas são construídas sobre o mesmo motor (primitivos Reka UI + Tailwind v4
css-first), o que torna a coexistência temporária viável durante a migração incremental.

## Decisão

Migrar integralmente a camada de componentes de `apps/web` para **@nuxt/ui v4**, em fases
(brainche `fase-4b-ui`):

1. Tema primeiro: `tokens.css` continua sendo o único lugar com hex; as cores semânticas do
   Nuxt UI (`--ui-*`) passam a apontar para os tokens existentes (`--ui-primary:
var(--primary)`, etc.), preservando o design system exato (docs/design/design-system.md).
2. Shell do app com `UDashboardGroup/UDashboardSidebar/UDashboardNavbar` (substitui
   sidebar/topbar handcrafted e o `Sheet` do menu mobile).
3. Componentes primitivos e de dados (`UButton/UInput/UBadge/UAvatar/UModal/UDropdownMenu/
USelect/UTable/USelectMenu/USwitch/UTooltip/UPagination`), toasts via `useToast` e
   formulários com `UForm` (Zod direto, fim de vee-validate).
4. Limpeza final: apagar `components/ui` + `components.json`, remover `shadcn-nuxt`,
   `reka-ui`, `vue-sonner`, `tw-animate-css`, `vee-validate` e unificar os dois pacotes
   lucide em `UIcon` (+ `@iconify-json/lucide` local para a SPA não depender da API
   Iconify).

## Consequências

- **Positivas:** shell de dashboard e tabela com ordenação prontos; validação de formulário
  declarativa (fecha os achados de auditoria de Metas e Usuarios); locale pt-BR nativo;
  toasts e color-mode unificados; menos dependências ao final (vee-validate, vue-sonner,
  tw-animate-css e a duplicação lucide saem).
- **Neutras:** os nomes das CSS vars do design system (`--foreground`, `--card`,
  `--sidebar*`…) não mudam — `utils/charts/palette.ts` segue lendo `getComputedStyle`.
- **Negativas/risco:** sem guia oficial de migração shadcn→Nuxt UI (manual); seletores E2E
  por role precisam ser preservados (ajustados apenas quando a semântica muda de verdade,
  ex.: `<select>` → listbox); guarda de drift visual via screenshots de baseline no Playwright.
- `apps/web/CLAUDE.md` e `.claude/rules/design-system.md` devem ser atualizados para
  refletir a nova fonte de componentes (Fase 8).
