// ESLint flat config único para o monorepo.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.output/**',
      '**/.nuxt/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/api/src/generated/**',
      'apps/web/app/components/ui/**',
      '.claude/skills/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Em TS/Vue quem verifica nomes indefinidos é o TypeScript (e o Nuxt tem auto-imports).
    files: ['**/*.ts', '**/*.vue'],
    rules: { 'no-undef': 'off' },
  },
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'off',
      'vue/multi-word-component-names': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Use tokens do design system em vez de cores hex (docs/design/design-system.md).',
        },
      ],
    },
  },
  {
    // Paleta e tokens são o único lugar onde hex é permitido.
    files: ['apps/web/app/utils/charts/palette.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // Proibido acessar pedidos fora do repositório com escopo (regra inegociável #1).
    files: ['apps/api/src/**/*.ts'],
    ignores: ['apps/api/src/modules/pedidos/scoped-pedidos.repository.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'pedido',
          message: 'Acesse pedidos só via ScopedPedidosRepository (docs/arquitetura/seguranca-rbac.md).',
        },
      ],
    },
  },
  prettier,
);
