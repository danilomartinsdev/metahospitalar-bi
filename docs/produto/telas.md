# Telas

Layout `default`: sidebar recolhível (primary-strong, logo branco) + topbar (período, busca global,
tema, menu do usuário). Layout `auth` para login. Layout `print` para PDF. Todas responsivas.

## Autenticação (layout auth)
| Rota | Objetivo | Componentes | Permissão |
|---|---|---|---|
| /login | Entrar | e-mail, senha, "esqueci minha senha" | pública |
| /esqueci-senha | Pedir link de redefinição | e-mail; resposta neutra (não revela se existe) | pública |
| /redefinir-senha?token= | Definir nova senha | senha + confirmação, regras de força | token válido |
| /trocar-senha | Troca obrigatória no 1º acesso | senha atual, nova, confirmação | autenticado |

## Dashboards (layout default)
Filtros globais na URL (store `filters`): período (mês, intervalo, ano), região, UF, gestor,
segmento, status, busca (cliente, nº pedido, CPR, gestor).

| Rota | Objetivo | Componentes | Permissão |
|---|---|---|---|
| /minhas-vendas | Minhas vendas (aparece por permissão, marcada em Papéis; é a página inicial de quem a tem, exceto o Admin) | KPIs total/pedidos/ticket; meta do mês e acumulada (barra de progresso); evolução mensal Real × Ano anterior × Meta; top 10 clientes; vendas por estado; 8 pedidos mais recentes. Filtro só de período. Mesmos endpoints da Visão geral, já filtrados pelo escopo no backend | minhas-vendas.view (+ dashboard.view para os dados) |
| /dashboard | Visão Geral | KPIs com variação + sparkline; chips (estados, regiões, gestores, clientes); evolução mensal Real × Ano anterior × Meta (ignora filtro de mês); donut Região ⇄ Público×Privado; Top 10 gestores; acumulado por segmento | dashboard.view |
| /dashboard/gestores | Ranking de gestores | gráfico + tabela ordenável, % participação, linha de total | dashboard.view |
| /dashboard/estados | Ranking por UF | idem | dashboard.view |
| /dashboard/regioes | Ranking por região | idem | dashboard.view |
| /dashboard/clientes | Clientes | ranking, recorrência, clientes novos | dashboard.view |
| /pedidos | Lista de pedidos | tabela paginada no servidor, colunas configuráveis, badge de status | pedidos.view |

Toda tabela tem botão "Exportar Excel" (export.xlsx); dashboards têm "Exportar PDF" (export.pdf).

## Administração (layout default)
| Rota | Objetivo | Permissão |
|---|---|---|
| /admin/importacoes | Upload (arrastar e soltar), prévia, confirmação, histórico de lotes, rollback | import.run / import.rollback |
| /admin/metas | Metas mensais total e por representante | metas.edit |
| /admin/representantes | Cadastro (nome de exibição, segmento, ativo) e **usuário de cada código** (com users.manage) — é o que limita o representante às próprias vendas | cadastros.edit (+ users.manage para ligar usuário) |
| /admin/clientes | Override de segmento por cliente | cadastros.edit |
| /admin/status-pdv | Significado dos status e se contam no total | cadastros.edit |
| /admin/usuarios | Usuários, papel, escopo (Todos / Por região; papel Representante não escolhe — vem do Cadastro de representantes), desativar, derrubar sessões | users.manage |
| /admin/papeis | Papéis e permissões editáveis | users.manage |
| /admin/auditoria | Log de auditoria filtrável | audit.view |

## Impressão (layout print)
| Rota | Objetivo | Acesso |
|---|---|---|
| /print/relatorio | Relatório executivo A4 para o Playwright | token de uso único |

Sem sidebar nem interação; inclui logo, filtros aplicados, KPIs, gráficos, rankings, rodapé
com usuário, data/hora e paginação.

## Estados obrigatórios
Todo bloco de dados: skeleton (loading), vazio com mensagem útil, erro com "tentar de novo".
Itens sem permissão não aparecem (useCan), e a rota redireciona para 403.
