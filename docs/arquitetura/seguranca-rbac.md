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

| Permissão       | Admin | Gestor comercial | Representante | Visualizador |
| --------------- | :---: | :--------------: | :-----------: | :----------: |
| dashboard.view  |   ✔   |        ✔         |       ✔       |      ✔       |
| minhas-vendas.view | ✔ |                  |       ✔       |              |
| pedidos.view    |   ✔   |        ✔         |       ✔       |      ✔       |
| import.run      |   ✔   |        ✔         |               |              |
| import.rollback |   ✔   |        ✔         |               |              |
| export.xlsx     |   ✔   |        ✔         |       ✔       | configurável |
| export.pdf      |   ✔   |        ✔         |       ✔       | configurável |
| metas.edit      |   ✔   |        ✔         |               |              |
| faturamento.view   |   ✔   |        ✔         |               |              |
| faturamento.import |   ✔   |        ✔         |               |              |
| cadastros.edit  |   ✔   |                  |               |              |
| users.manage    |   ✔   |                  |               |              |
| audit.view      |   ✔   |                  |               |              |

`import.rollback` para Gestor e `cadastros.edit` só para Admin são **propostas** a confirmar.
Escopo padrão: Admin/Gestor comercial = todos; Representante = representantes vinculados;
Visualizador = configurável.

## Escopo de dados

- Tipos: `todos`, `regiao` (lista de regiões), `representantes` (vínculos do usuário).
- **Vínculo usuário ↔ código do Focco** (2026-10-07): feito em Administração › Cadastro de
  representantes (`PUT /usuarios/vinculos/:representanteId`, exige `users.manage`), não no cadastro de
  usuário — lá, papel Representante não escolhe escopo. Um usuário por código; um usuário pode ter vários
  códigos. Ligar põe o usuário no escopo `representantes`; quem perde o último código continua nele e
  **não vê nenhum pedido** (nunca passa a ver a empresa toda). Ninguém liga/desliga a si mesmo; só Admin
  mexe no vínculo de um Admin; auditado como `representante.vinculo`.
- Aplicado **apenas no backend** pelo `ScopedPedidosRepository`, que recebe o usuário da
  requisição e adiciona o `where` de escopo a toda consulta de pedidos (listas, agregações,
  rankings, exportações, impressão).
- IDs vindos do cliente (pedido, cliente, representante) são resolvidos dentro do escopo; fora
  dele → 404 (não 403, para não revelar existência).
- Filtros do usuário são **intersectados** com o escopo, nunca substituem.
- Token de impressão carrega o usuário e os filtros; a rota de dados do print usa o mesmo escopo.
- Metas sem correspondência no escopo (escopo por região) não são exibidas.
- `GET /representantes` devolve só os vinculados para escopo "representantes".
- **Ações que valem para a base inteira exigem escopo "todos"**, além da permissão: importação
  (prévia, confirmar, lotes, rollback), metas (ler e salvar) e faturamento (ver e importar — é um número da
  empresa inteira, sem representante). A prévia pertence a quem a enviou.

- **Minhas vendas, menu e página inicial são só UI** (`utils/navegacao.ts`): /minhas-vendas exige
  `minhas-vendas.view` — só a permissão, marcada em Papéis, decide se a tela aparece (o escopo decide quais
  pedidos ela mostra). O Admin tem a permissão por regra: vê o item, mas a página inicial dele é a Visão geral;
  quem pode vê-la cai nela após o login. Nada disso
  protege dado — os números vêm dos endpoints de dashboard (`dashboard.view`) filtrados pelo
  `ScopedPedidosRepository`.

## Proteção contra escalonamento de privilégio (Fase 4)

- Ninguém altera o próprio papel, o próprio escopo nem as permissões do papel que usa.
- Só um **Admin** cria, promove, altera, desativa ou redefine a senha de outro Admin.
- Só um Admin concede permissões administrativas (`users.manage`, `audit.view`) a um papel.
- O papel Admin mantém todas as permissões; papéis padrão não podem ser removidos; papel com
  usuários não pode ser removido.
- Mudanças de papel, permissão e escopo valem na próxima requisição (usuário recarregado a cada chamada).

## Implementação das permissões

A checagem é feita pelo `AuthGuard` global (permissão declarada por rota) e o escopo pelo
`ScopedPedidosRepository`. O CASL, previsto na stack, **não foi adotado**: as regras atuais são
simples (permissão por rota + filtro de escopo) e já estão cobertas por testes; o CASL acrescentaria
uma camada sem ganho. Reavaliar se surgirem regras por atributo (ex.: permissões por campo).
O ESLint proíbe `prisma.pedido`, relações `pedidos` e SQL cru fora do repositório com escopo.

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
