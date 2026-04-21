# 🧪 Guia de Testes — MIDIAS

Este documento descreve como testar **todas as funcionalidades** do sistema (Web, Desktop e fluxos de banco).

> **Os dados de teste já foram populados no banco.** Use as credenciais abaixo direto na tela de login. Se em algum momento precisar repopular, a Edge Function `seed-test-users` continua disponível e é idempotente.

---

## 1. Contas de teste

### 👤 Clientes

| E-mail | Senha | Papel no teste |
|---|---|---|
| `cliente1@teste.com` | `Teste@123` | Comprador comum (faz pedidos, denuncia, favorita) |
| `cliente2@teste.com` | `Teste@123` | Vendedor marketplace (publica anúncios, recebe denúncias) |
| `cliente3@teste.com` | `Teste@123` | Avaliador (escreve reviews, comenta) |
| `banido@teste.com`   | `Teste@123` | **Conta suspensa por 7 dias** — para testar o banner global e bloqueio de RLS |

### 🛠️ Funcionários (já existem no banco — senha definida na criação original)

| E-mail / Nome | Cargo | Acesso desktop |
|---|---|---|
| `admin2@midias.com` | **Admin** | Tudo |
| Roberto Gerente | **gerente** | Quase tudo (sem configurações sensíveis) |
| Juliana Moderadora | **moderador** | Moderação, denúncias, fórum |
| Lucas Marketplace | **atendente_marketplace** | Anúncios, propostas, denúncias |
| Paulo / 67 | **estoquista** | Estoque, produtos, fornecedores |
| Carla Atendente | **atendente** | Pedidos, mensagens, clientes |

> Se você não souber a senha de algum funcionário, faça login como admin e use `/desktop/funcionarios` para resetar.

---

## 2. Fluxos de teste (Web — `/`)

### 2.1 Fluxo cliente comum (use `cliente1@teste.com`)
1. **Login** em `/auth` (e-mail + senha).
2. **Catálogo** `/catalogo` → filtre por categoria, abra um jogo.
3. **Favoritar** → ícone de coração.
4. **Adicionar ao carrinho** → ir para `/carrinho`.
5. **Aplicar cupom** (ex: `BEMVINDO10`) → checkout `/checkout`.
6. **Pagar com Pix** → confirme o desconto de 5%.
7. Verifique a tela `/checkout/sucesso` e depois `/biblioteca`.
8. **Avaliar o jogo comprado** em `/perfil` → aba "Minhas Avaliações" ou na página do jogo.

### 2.2 Reset de senha
1. Em `/auth`, clique em **"Esqueci minha senha"**.
2. Informe o e-mail → o link chega no inbox de e-mail (ou nos logs do Supabase Auth).
3. Clicar no link cai em `/reset-password` → defina nova senha.

### 2.3 Banimento (use `banido@teste.com`)
1. Faça login com `banido@teste.com`.
2. **Confirme**:
   - 🔴 Barra vermelha aparece **no topo de todas as páginas** (Header global).
   - Em `/perfil`, banner detalhado com data de fim do banimento.
   - Tentar criar um anúncio, denúncia, mensagem ou post de fórum → bloqueado pelo RLS (`is_user_banned`).
3. Para **desbanir**: como admin, vá em `/desktop/moderacao` → encontre o usuário → clique "Desbanir".

### 2.4 Bloqueio entre usuários
1. Como `cliente1@teste.com`, vá ao perfil público de `cliente2` e clique em **Bloquear**.
2. Em `/perfil` → aba **"Usuários Bloqueados"** o usuário deve aparecer.
3. Desbloqueio funciona pela mesma aba.

---

## 3. Fluxos de teste (Desktop — `/desktop/*`)

> Acesse `/desktop/login` com qualquer funcionário. O **menu lateral mostra apenas as seções permitidas pelo cargo**.

### 3.1 Admin (`admin2@midias.com`)
- `/desktop/dashboard` — KPIs gerais
- `/desktop/produtos` — CRUD completo (com upload em `product-images`)
- `/desktop/categorias` — CRUD com **upload de imagem**
- `/desktop/fornecedores` — CRUD
- `/desktop/cupons` — criar/desativar cupom, ver uso
- `/desktop/funcionarios` — criar funcionário (Edge Function `manage-employee`)
- `/desktop/relatorios` — **exportar CSV** (PDF está pausado)
- `/desktop/configuracoes` — 6 abas, todas persistem em `site_settings`
- `/desktop/moderacao` — banir/desbanir, resolver denúncias
- `/desktop/certificados` — aprovar/recusar com motivo obrigatório

### 3.2 Estoquista (`paulo` / cargo estoquista)
- `/desktop/estoque` — gráfico com filtros **7d / 30d / 90d**, registrar movimentação manual (entrada/saída/ajuste).
- `/desktop/produtos` — apenas leitura/edição básica.

### 3.3 Moderador (`juliana`)
- `/desktop/moderacao` — denúncias geradas pelo seed devem aparecer.
- `/desktop/forum` — moderar posts/respostas.
- `/desktop/anuncios` — pode rejeitar anúncios.

### 3.4 Marketplace (`lucas`)
- `/desktop/anuncios`, `/desktop/propostas-troca`, `/desktop/mensagens`, `/desktop/certificados`.

### 3.5 Atendente (`carla`)
- `/desktop/pedidos` — abrir modal, alterar status do pedido.
- `/desktop/mensagens`, `/desktop/clientes`.

---

## 4. Checklist QA rápido

- [ ] Login/logout em web e desktop
- [ ] Cadastro novo + auto-criação do `profiles` e `user_roles`
- [ ] Reset de senha (e-mail recebido + tela `/reset-password` funcional)
- [ ] Banner de banimento aparece no Header global
- [ ] Cliente banido não consegue criar anúncio (toast/erro RLS)
- [ ] Cupom aplica desconto e respeita `max_uses`
- [ ] Pix dá 5% de desconto no checkout
- [ ] Após confirmar pedido, item entra na biblioteca e estoque cai
- [ ] Cancelar pedido devolve estoque
- [ ] Movimentação manual de estoque registra em `movimentacoes_estoque`
- [ ] Gráfico de estoque alterna entre 7/30/90 dias
- [ ] Categorias salvam upload no bucket `product-images`
- [ ] Configurações do site (loja, políticas, notificações) persistem após reload
- [ ] Footer e página `/contato` mostram dados de `site_settings.store_info`
- [ ] Denúncias geradas pelo seed aparecem em `/desktop/moderacao`
- [ ] Certificado pendente aparece em `/desktop/certificados`
- [ ] Aprovar/recusar certificado pede motivo
- [ ] **Badges vermelhos no menu lateral** mostram contagem de pedidos/denúncias/certificados/propostas pendentes
- [ ] Resolver uma denúncia faz o badge cair em tempo real (Realtime)
- [ ] **Exportar PDF** em `/desktop/relatorios` gera arquivo com KPIs, top produtos e série diária
- [ ] **Trigger de banimento**: tente alterar `banned_until` logado como `gerente` ou `cliente1` → operação rejeitada com erro 42501

---

## 5. Limitações conhecidas (documentadas, não são bugs)

1. **Movimentações de estoque não podem ser deletadas/editadas** — por desenho (auditoria imutável). Se errar, registre uma movimentação de ajuste compensatória.
2. **Fórum é exclusivo do mobile** — decisão de escopo: Web = loja, Mobile = comunidade. O backend (`forum_posts`/`forum_replies`) é compartilhado e o admin pode moderar via `/desktop/forum`, mas usuários web não postam.
3. **Pagamentos são 100% simulados** (TCC) — Pix e Cartão apenas registram o pedido, sem integração real.

---

## 6. Resetar dados de teste

Não há botão de "limpar". Para começar do zero:
- Os dados criados pelo seed têm `@teste.com` como sufixo dos e-mails — fácil identificar.
- Para limpar via SQL (admin do banco): delete primeiro `mensagens`, `forum_replies`, `forum_posts`, `denuncias`, `certificados`, `favoritos`, `fotos_anuncio`, `anuncios` filtrando por `user_id` dos clientes de teste, e por fim os usuários em `auth.users`.

---

**Última atualização**: badges de pendências no menu lateral, exportação PDF de relatórios e proteção do `banned_until` via trigger.
