## Escopo

Refinamentos Fase 2 + Fase 6. Volume muito alto — vou agrupar em 4 lotes executáveis em sequência. Cada lote = 1 migração + ajustes de UI focados. Sem reconstruir o que já existe.

---

### Lote 1 — Banco de dados (1 migração única)

Tudo num único arquivo SQL para evitar idas e voltas:

- **Badges personalizados / títulos**
  - `badge_catalog.is_custom boolean default false`, `image_url text` (alternativa ao emoji)
  - Nova tabela `user_titles` (id, user_id, name, source: 'xp'|'achievement', tournament_id, awarded_by, awarded_at)
  - `profiles.active_title_id uuid` (qual título de conquista exibir)
- **Torneios — XP escalável + 2º/3º lugar**
  - `tournaments`: `xp_signup int`, `xp_match_win int`, `xp_champion int`, `verified boolean`, `prize_type text[]`, `prize_game_id uuid`, `prize_coupon_id uuid`, `prize_badge_id text`, `prize_title text`, `prize_xp_bonus int`
  - `tournament_participants`: `final_rank int`, `rewards_distributed boolean`
  - Função `calc_tournament_xp(max_participants)` retorna json {signup, win, champion} usando a tabela do prompt
  - Trigger antes de insert/update em tournaments preenche os 3 xp automaticamente
- **Anti-duplicação**
  - `tournament_participants`: `signup_ip inet`, `device_fingerprint text`, `phone_verified boolean`
  - `tournament_duplicate_alerts` (id, tournament_id, user_ids[], reason, resolved)
- **Chat de torneio**
  - `mensagens`: `tournament_id uuid`, `match_id uuid`, `is_admin_chat boolean`, `flagged_auto boolean`
  - Constraint server-side: `length(content) <= 2000`
  - Trigger rate-limit (>30 msgs em 60s no mesmo torneio → flag automática + ban 90 dias via `profiles.banned_until`)
- **Biblioteca — nota pessoal**
  - `biblioteca_usuario`: `personal_note text`, `status_updated_at timestamptz`
- **Feed social — infinite scroll** já viável via offset/limit, sem schema novo
- **XP awards p/ torneio**: função `award_tournament_rewards(tournament_id)` distribui XP 100%/60%/35%, cria badges + título de conquista, marca `rewards_distributed=true`

---

### Lote 2 — Refinamentos UI globais (FIX-1, BUNDLE-1, REC-1, SOC-1)

- **FIX-1 Debounce universal**: hook `useSubmitGuard()` que retorna `{submitting, guard(fn)}`. Aplicar em: `MChat` (envio msg), `MForum`/`MForumPost` (criar post/reply), `MNewAd`, `MReview`, `Auth`, `Checkout`, todos os Dialogs de criação do desktop (`Produtos`, `Cupons`, `Categorias`, `Badges`, `Promocoes`, `Torneios`, etc.). Padrão: `<Button disabled={submitting} onClick={guard(handler)}>`.
- **BUNDLE-1**: incluir bundles como cards no `Catalogo.tsx` e `Index.tsx` (badge "BUNDLE" no canto, lista de jogos abaixo). Rota `/bundle/:id` reaproveitando layout de `GameDetail`.
- **REC-1**: `ParaVoce.tsx` — adicionar campo `reason` calculado por jogo, renderizar abaixo do título sempre visível.
- **SOC-1**: `Social.tsx` — infinite scroll (`IntersectionObserver`) + chips de filtro (compra/wishlist/torneio).

---

### Lote 3 — Sistema de Torneios completo (TOURN-1..4, XP-3..6)

- **Desktop `Torneios.tsx`**:
  - Form de criação mostra XP calculado em tempo real ao mudar `max_participants`
  - Multi-select de tipos de prêmio (sem dinheiro): jogo, cupom, badge, título, xp bônus
  - Toggle "Torneio verificado" (exige telefone)
  - Nova aba "Recompensas" em torneios encerrados: lista 1º/2º/3º com botão "Confirmar e distribuir" → chama RPC
  - Aba "Alertas de duplicata" mostrando `tournament_duplicate_alerts`
  - Botão "Falar com participante" em cada ficha cria conversa admin
- **Web `Torneios.tsx` + `TournamentBracket`**:
  - Realtime via `supabase.channel().on('postgres_changes')` em `tournament_participants` e `tournament_matches`
  - Exibe os 3 valores de XP antes do botão Inscrever
  - Botão "Falar com o admin" (cria conversa marcada como `is_admin_chat`)
  - Bloqueia inscrição se email não confirmado / telefone faltando (quando verified)
  - Captura fingerprint via `navigator.userAgent + screen` hash simples
- **Mobile `MChat`**: nova aba "Torneios" agrupando conversas por `tournament_id` → categoria → match. Cor vermelha + tag.

---

### Lote 4 — Perfil + Biblioteca (XP-1, XP-2, LIB-1)

- **Desktop `Badges.tsx`**:
  - Aba extra "Personalizados" — criar badge com upload de imagem (bucket `product-images` reaproveitado ou novo)
  - Botão "Atribuir a usuário" (busca por email/nome) → insere em `user_badges` marcado como custom
  - Aba "Títulos de conquista" — criar título e atribuir a usuário ou a todos vencedores de torneio
- **`PublicProfile.tsx` + `Perfil.tsx`**:
  - Exibe `Nível XP · Título Ativo` (hierarquia visual)
  - Dropdown "Título exibido" para usuário escolher entre seus `user_titles` de tipo achievement
  - Badges custom com borda dourada/animada para diferenciar
- **LIB-1 — Página jogo possuído**: nova rota `/biblioteca/:productId`
  - Layout distinto (dark, sem botão de compra)
  - Painéis: aquisição, status (select sincronizado mobile), nota pessoal (textarea privada), minhas reviews, torneios desse jogo que participei, atividade de amigos, meus posts do fórum
  - Link a partir de `Biblioteca.tsx` aponta para essa rota em vez de `/jogo/:id`

---

## Avisos

- Volume muito alto: vou executar lote por lote, parando depois de cada migração para garantir aprovação.
- Não vou reescrever páginas existentes — só adicionar componentes/abas/campos.
- Realtime de torneios usa `postgres_changes` (já habilitado no projeto).
- Anti-flood/ban automático será um trigger simples por contagem, não ML.

Aprova o plano? Se sim, começo pelo **Lote 1 (migração única)**.
