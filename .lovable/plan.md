

Vou analisar o estado atual e levantar o que falta + melhorias.
<lov-tool-use id="toolu_vrtx_01VNSkkHGmDe1tXaS4KUD8H5" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Perfil.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EqeqDTLP4zxF1Cj7yH6UvS" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Biblioteca.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01P9t4nLMpcstEKmdbvFtya7" name="code--view" integration-id="code" data="{\"file_path\": \"src/desktop/pages/Configuracoes.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01T7iZYqh6ZVAavquTkZgPKu" name="code--view" integration-id="code" data="{\"file_path\": \"src/desktop/pages/Produtos.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01ESaoo773tFJHVGkUuovZqj" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/Footer.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Dutcu8kWVVFExtdxZYESXB" name="code--exec" integration-id="code" data="{\"command\": \"cat user-uploads://todos.txt 2>/dev/null || echo \\\"no file\\\"\", \"user_facing_description\": \"Verificando lista original de TODOs\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01RnmLGwFaan6cb2n6R3rZcC" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Perfil.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AzbgnknZGwfX2PD8wjNgaA" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Biblioteca.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DSFZzfbvzu8zUdon4JFo1C" name="code--view" integration-id="code" data="{\"file_path\": \"src/desktop/pages/Configuracoes.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01UZhPciDx7bMpJspwfHEy7D" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/Footer.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01MSZaecq2j6GX8cv41vrJK8" name="code--list_dir" integration-id="code" data="{\"dir_path\": \"src/desktop/pages\"}">
</lov-tool-use>
<lov-plan>

## Análise: o que está pronto, o que falta e o que pode melhorar

### Status atual (resumo)

**Web (E-commerce/Biblioteca):**
- ✅ Auth, Catálogo, Ofertas, GameDetail, Carrinho, Checkout (simulado), CheckoutSucesso, Pedidos, Favoritos, Perfil, Biblioteca, FAQ, Contato, Termos, PublicProfile
- ✅ Configurações de conta no /perfil (avatar, dados, privacidade, notificações, senha)
- ✅ Reviews removidas da home/catálogo (mantidas só em GameDetail com 0.5–5.0)
- ✅ Cupons funcionais no checkout

**Desktop (Backoffice):**
- ✅ 19 telas: Dashboard, Produtos, Funcionários, Clientes, Fornecedores, Categorias, Cupons, Estoque, Pedidos, Anúncios, Propostas, Mensagens, Avaliações, Notificações, Fórum, Moderação, Relatórios, Certificados, Configurações
- ✅ RBAC com 6 cargos, sidebar dinâmica
- ✅ Gráficos (recharts) em Dashboard e Relatórios
- ✅ CRUD completo em Produtos/Funcionários/Clientes/Fornecedores/Categorias

---

### O que ainda FALTA / está incompleto

**Web:**
1. **Footer ainda lista "Biblioteca" como link público** mas não há link para Pedidos/Favoritos no footer logado.
2. **Detalhes do pedido** — em `/pedidos`, não dá pra abrir um pedido para ver itens/status/cupom usado.
3. **Recuperação de senha** no `/auth` web (existe `ResetPassword.tsx`, mas falta o "Esqueci minha senha" no fluxo do desktop login).
4. **Lista de usuários bloqueados** no /perfil web (usuário bloqueia no mobile, deveria ver/remover no web).
5. **Fórum/Reviews/Avaliações usuário não existem no web** (correto — são mobile-only). Mas falta confirmar que não há rotas órfãs.
6. **Página de "Minhas Avaliações"** em /perfil para o usuário gerenciar reviews que escreveu.

**Desktop:**
1. **Configurações da loja não persistem** — todos os Switches/Inputs são `defaultValue`/`defaultChecked` mockados. Falta tabela `site_settings` (singleton) + hook + persistência.
2. **Notificações de e-mail** na aba Configurações não estão conectadas a nada.
3. **Estoque** — falta UI de movimentação manual (entrada/ajuste) gravando em `movimentacoes_estoque`.
4. **Pedidos Online** — falta modal com itens, mudança de status (confirmar/cancelar/enviar) e impacto real no estoque (já há trigger).
5. **Relatórios** — falta exportação (CSV/PDF) e gráfico de evolução de clientes.
6. **Certificados** — verificar fluxo de aprovar/recusar com motivo.
7. **Moderação** — falta ação real de banimento temporário (precisa coluna `banned_until` em `profiles`).
8. **Categorias** — falta upload de imagem da categoria (bucket existe).
9. **Funcionários** — confirmar que reset de senha via Edge Function funciona.

**Banco de dados (alinhamento 3 plataformas):**
1. **Tabela `site_settings`** (singleton com chave/valor JSON) para configurações persistirem.
2. **Coluna `banned_until` em `profiles`** para banimento temporário.
3. **Tabela `notification_preferences`** (ou colunas extras em profiles) para granularidade de avisos por evento.
4. **Falta FK formal** entre várias tabelas (produtos.category_id → categorias.id etc.) — schema funciona mas sem integridade referencial declarada.

---

### Plano de execução proposto (ordem de prioridade)

**FASE 1 — Banco (migration única)**
- Criar tabela `site_settings` (id, key, value jsonb, updated_at, updated_by) com RLS: SELECT público, INSERT/UPDATE só admin.
- Adicionar `banned_until timestamptz` em `profiles`.
- Seed inicial de `site_settings` com chaves: `store_info`, `sale_policies`, `email_notifications`, `marketplace`, `security`.

**FASE 2 — Desktop**
- `useSiteSettings` hook (load/save por chave).
- Refatorar `Configuracoes.tsx` para ler/gravar de `site_settings` (todas as 5 abas que hoje são mock).
- **Pedidos Online**: modal de detalhes com itens, alterar status (dropdown), reembolso simulado.
- **Estoque**: botão "Movimentação manual" gravando em `movimentacoes_estoque`.
- **Categorias**: upload de imagem.
- **Moderação**: botão "Banir temporariamente" usando `banned_until`.
- **Relatórios**: botão "Exportar CSV" do faturamento.

**FASE 3 — Web**
- **Pedidos**: modal de detalhes do pedido com itens, total, cupom, status.
- **Perfil**: nova aba "Usuários Bloqueados" lendo de `blocked_users` + botão desbloquear.
- **Perfil**: nova aba "Minhas Avaliações" listando reviews escritas com editar/excluir.
- **Footer**: limpar estrutura, garantir só links válidos.
- **Auth**: confirmar "Esqueci minha senha" funciona ponta-a-ponta.

**FASE 4 — Polimento**
- Atualizar memórias (`mem://features/desktop-settings-admin` e criar `mem://database/site-settings`).
- Verificar nenhum link quebrado em footer/header/perfil.

---

### Detalhes técnicos rápidos

```text
site_settings
├── id uuid PK
├── key text UNIQUE  ('store_info'|'sale_policies'|...)
├── value jsonb       (todo o objeto da seção)
├── updated_at timestamptz
└── updated_by uuid

profiles + banned_until timestamptz
  → trigger no login: bloqueia se now() < banned_until
```

**Confirma que posso seguir com tudo isso (Fases 1→4) ou prefere priorizar alguma fase específica primeiro?**

