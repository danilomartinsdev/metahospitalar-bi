# Convenções da API

- Base: `/api`. JSON. Nomes de recursos em português, plural, kebab-case (`/api/status-pdv`).
- OpenAPI gerado em `/api/docs` (apenas em dev) a partir dos schemas Zod (nestjs-zod).
- Autenticação: `Authorization: Bearer <access token>`; refresh via cookie em `/api/auth/refresh`.
- Toda rota declara `@RequirePermission(...)`; rotas públicas usam `@Public()` explicitamente.

## Entrada
- Body e query validados com schemas de `packages/shared` → 400 com detalhes por campo.
- Filtros de dashboard: schema único `FiltrosDashboard` (período, região, UF, gestor, segmento,
  status, busca), reutilizado em dashboard, pedidos e export.

## Paginação, ordenação
`?page=1&pageSize=25&sort=dtEmissao:desc`. Resposta:
```json
{ "data": [], "meta": { "page": 1, "pageSize": 25, "total": 0 } }
```
`pageSize` máximo 200.

## Valores
- Dinheiro em JSON como **string decimal** (`"83575.75"`), nunca number.
- Datas sem hora como `YYYY-MM-DD`; instantes em ISO 8601 com offset.

## Erros
```json
{ "statusCode": 400, "error": "Bad Request", "message": "Validação falhou", "code": "VALIDATION", "details": [] }
```
Códigos: 400 validação, 401 não autenticado, 403 sem permissão, 404 inexistente ou fora do
escopo, 409 conflito (ex.: rollback bloqueado), 413 arquivo grande, 429 rate limit.

## Endpoints
Lista mantida aqui conforme os módulos forem criados (skill `novo-modulo-api`).
