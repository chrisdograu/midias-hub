
## Backoffice Desktop - Design Completo (Dados Mockados)

### Estrutura Base
- Layout desktop com **sidebar fixa** e visual sóbrio/corporativo (diferente do e-commerce)
- Rotas sob `/desktop/*` separadas do e-commerce web
- Todas as páginas com **dados mockados** (sem Supabase por enquanto)

### Páginas a criar (13 telas):

1. **Login Desktop** (`/desktop/login`) - Tela de login exclusiva para funcionários
2. **Dashboard** (`/desktop`) - Cards com métricas, gráficos de vendas, alertas de estoque baixo
3. **Produtos** (`/desktop/produtos`) - Tabela com CRUD, filtros, status ativo/inativo
4. **Funcionários** (`/desktop/funcionarios`) - Lista, níveis Admin/Atendente, ativar/desativar
5. **Clientes** (`/desktop/clientes`) - Lista com CPF, telefone, histórico
6. **Fornecedores** (`/desktop/fornecedores`) - Lista com CNPJ, contato, produtos vinculados
7. **Categorias** (`/desktop/categorias`) - Grid de categorias com edição
8. **Vendas Presenciais** (`/desktop/vendas`) - PDV com carrinho, desconto, formas de pagamento
9. **Estoque** (`/desktop/estoque`) - Movimentações, alertas, ajuste manual
10. **Pedidos Online** (`/desktop/pedidos`) - Listagem com filtros por status, detalhes
11. **Moderação** (`/desktop/moderacao`) - Anúncios denunciados, bloqueio de usuários
12. **Relatórios** (`/desktop/relatorios`) - Gráficos de vendas, faturamento, comparativos
13. **Certificados** (`/desktop/certificados`) - Solicitações pendentes, aprovação/recusa

### Design
- Paleta corporativa usando os tokens existentes (teal/roxo) mas com tom mais sóbrio
- Sidebar com ícones + texto, agrupada por seção
- Tabelas, formulários e cards consistentes
- Responsivo mínimo 1280px
