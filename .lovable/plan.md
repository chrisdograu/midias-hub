## Fase 4 — E-commerce Web (refinamento)

Foco: paridade de qualidade com o mobile e polir a experiência de compra que já existe.

**Catálogo & Ofertas**
- `Catalogo.tsx` / `Ofertas.tsx`: migrar fetch direto para `useProdutos()` (React Query já existe) + `Skeleton` no loading + estado vazio com CTA.
- Adicionar chips de filtro por plataforma (usando as cores semânticas de plataforma já criadas na Fase 1 de UI) + ordenação (mais recentes / preço asc / preço desc / mais avaliados).
- Persistir filtros na URL (`?platform=&sort=`) para deep-link e voltar do detalhe manter estado.

**GameDetail (web)**
- Skeleton dedicado enquanto `useProduto` carrega (hoje pisca vazio).
- Prefetch do produto no hover do `GameCard` (já temos `usePrefetchRoute`, estender com prefetch de dados).
- Selo de estoque unificado ("Últimas unidades" quando `stock <= 3`, "Esgotado" quando 0) — hoje inconsistente.
- Botão "Adicionar aos favoritos" com feedback ótico imediato (optimistic update no React Query).

**Carrinho & Checkout**
- `Carrinho.tsx`: mostrar economia total quando houver bundle ou desconto ativo; empty state com CTA para catálogo.
- `Checkout.tsx`: validação inline dos campos de endereço/cartão (regex CEP/CPF), resumo fixo (sticky) do pedido no desktop.
- `CheckoutSucesso.tsx`: adicionar links diretos para "Ver biblioteca" e "Ver pedido".

**Bundles**
- `BundleDetail.tsx`: mostrar % de economia com destaque + gráfico simples "preço avulso vs bundle".
- `ProductBundles.tsx`: migrar para React Query (hoje usa `useEffect`+`useState` sem cache).

## Fase 5 — Fórum (Web + Mobile)

Foco: o fórum já existe, precisa de moderação, engajamento e paridade cross-platform.

**Migration**
- `forum_posts.is_spoiler` (bool, default false) — permite marcar post inteiro como spoiler, integra com `SpoilerGuard`.
- `forum_posts.is_locked` (bool, default false) — trancar tópico (só mods respondem).
- `forum_post_reports` já resolvido via `denuncias` existente (target_type='forum_post') — não precisa nova tabela.
- Index em `(category_id, is_pinned desc, created_at desc)` para lista.

**Web — `ForumGeral.tsx`**
- Filtro por categoria (chips no topo) + busca por título.
- Ordenação: recentes / mais curtidos / mais respondidos.
- Skeleton + empty state + botão "Nova discussão" com dialog inline.

**Mobile — `MForum.tsx` / `MForumComunidade.tsx` / `MForumGame.tsx`**
- Unificar visual: mesmo card de post (avatar, título, prévia, contadores) entre "por jogo" e "comunidade".
- Adicionar toggle "🚨 Marcar como spoiler" no compositor de post e reply.
- Aplicar `SpoilerGuard` no render quando `is_spoiler=true`.
- Botão "Denunciar" no menu do post (reusa `ReportDialog`).

**Post detalhado (`MForumPost.tsx`)**
- Mostrar cadeado quando `is_locked=true` + esconder input de resposta.
- Reply com quote (citar mensagem original — reusa mesmo padrão do chat).
- Marcar melhor resposta (autor pode fixar 1 reply — nova coluna `forum_replies.is_solution` opcional; se ficar apertado, deixar para fase seguinte).

**Admin — `ForumAdmin.tsx`**
- Ações em lote: fixar, trancar, excluir, marcar spoiler.
- Contador de denúncias pendentes por post (join com `denuncias`).
- Filtro por categoria e por "com denúncia ativa".

## Ordem de execução

1. Migration única (forum: `is_spoiler`, `is_locked`, index).
2. Fase 4 — Catalogo/Ofertas com React Query + filtros URL.
3. Fase 4 — GameDetail skeleton + Carrinho/Checkout polish + ProductBundles em React Query.
4. Fase 5 — ForumGeral (web) filtros + ordenação + skeleton.
5. Fase 5 — Mobile forum (spoiler toggle + SpoilerGuard + report + lock).
6. Fase 5 — ForumAdmin ações em lote + denúncias.

**Sem quebras**: nenhuma alteração de contrato de API; só adição de colunas com default e refactors de fetch para React Query.

Aprova prosseguir?
