# Segurança e RBAC

## Autenticação
- Login por e-mail + senha (argon2id). Mensagem de erro genérica.
- Access token JWT de **15 min**, guardado só em memória no front (nunca localStorage).
- Refresh token opaco, **rotativo**, em cookie `httpOnly; Secure; SameSite=Strict; Path=/api/auth`.
  Guardado como hash na tabela `Sessao`; reuso de token já rotacionado revoga toda a família.
- **Bloqueio** após 5 falhas consecutivas (`LOGIN_MAX_ATTEMPTS`) por 15 min **[PENDENTE: duração]**;
  sucesso zera o contador.
- **Inatividade:** sessão expira após `SESSION_IDLE_TIMEOUT_MIN` sem uso do refresh.
- **Troca obrigatória** de senha no primeiro acesso e após redefinição pelo admin.
- **Esqueci a senha:** token aleatório (hash no banco), validade 1 h, uso único, enviado por SMTP;
  resposta neutra; redefinir revoga todas as sessões.
- Admin pode **desativar** usuário e **derrubar sessões** (revoga todas as `Sessao`).

## Papéis padrão (editáveis na UI)
| Permissão | Admin | Gestor comercial | Representante | Visualizador |
|---|:-:|:-:|:-:|:-:|
| dashboard.view | ✔ | ✔ | ✔ | ✔ |
| pedidos.view | ✔ | ✔ | ✔ | ✔ |
| import.run | ✔ | ✔ | | |
| import.rollback | ✔ | ✔ | | |
| export.xlsx | ✔ | ✔ | ✔ | configurável |
| export.pdf | ✔ | ✔ | ✔ | configurável |
| metas.edit | ✔ | ✔ | | |
| cadastros.edit | ✔ | | | |
| users.manage | ✔ | | | |
| audit.view | ✔ | | | |

`import.rollback` para Gestor e `cadastros.edit` só para Admin são **propostas** a confirmar.
Escopo padrão: Admin/Gestor comercial = todos; Representante = representantes vinculados;
Visualizador = configurável.

## Escopo de dados
- Tipos: `todos`, `regiao` (lista de regiões), `representantes` (vínculos do usuário).
- Aplicado **apenas no backend** pelo `ScopedPedidosRepository`, que recebe o usuário da
  requisição e adiciona o `where` de escopo a toda consulta de pedidos (listas, agregações,
  rankings, exportações, impressão).
- IDs vindos do cliente (pedido, cliente, representante) são resolvidos dentro do escopo; fora
  dele → 404 (não 403, para não revelar existência).
- Filtros do usuário são **intersectados** com o escopo, nunca substituem.
- Token de impressão carrega o usuário e os filtros; a rota de dados do print usa o mesmo escopo.

## Auditoria
Ações auditadas: login (sucesso/falha/bloqueio), logout, troca/redefinição de senha,
importação, rollback, exportação (xlsx/pdf, com filtros), mudança de papel/permissão/escopo,
criação/desativação de usuário, derrubar sessões, edição de metas e cadastros.
Detalhes nunca contêm senha, token ou conteúdo de planilha.

## Proteções HTTP
Helmet (CSP restrita), CORS só para `WEB_ORIGIN`, rate limit global e mais rígido em
`/auth/*`, limite de body e de upload, filtro global de exceções (sem stack/SQL),
logs Pino com requestId e redaction de campos sensíveis.

## Testes obrigatórios
Para cada endpoint de dados (inclusive export e print): um usuário de cada escopo prova que não
vê pedidos de outro escopo. Rodam contra Postgres real.
