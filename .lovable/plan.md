## Rodada A8 — Plano completo

Você apontou 10 problemas distintos. Vou resolver todos numa rodada, agrupados em 4 blocos.

---

### Bloco 1 — Customização do perfil e biblioteca (UI real)

**Onde vive hoje:** colunas `theme_color`, `profile_cover_url`, `trophy_showcase` em `profiles` e tabela `library_custom_covers` já existem (migração da rodada anterior), mas **não há UI**. Vou criar:

1. **`src/components/perfil/CustomizacaoTab.tsx`** — nova aba "Customização" em `/perfil`:
   - Color picker (input nativo `type=color` + 8 presets) para `theme_color` → aplicado como CSS var `--profile-accent` no `PublicProfile`/`FriendProfile`.
   - Uploader de banner (`profile_cover_url`) usando bucket `avatars` (subpasta `covers/`).
   - Editor da Vitrine de Troféus: seleciona até 6 badges/títulos (`trophy_showcase` jsonb).
2. **`src/components/biblioteca/CustomCoverEditor.tsx`** — botão "Capa custom" em cada card da `Biblioteca.tsx`; abre modal com upload (bucket `product-images`, pasta `custom-covers/{userId}/`) → grava em `library_custom_covers`. Cards e `BibliotecaJogo` passam a usar a capa custom quando existe.
3. **`PublicProfile`/`FriendProfile`** — leem `theme_color`+`profile_cover_url`+`trophy_showcase` e renderizam banner + acento de cor + vitrine.

---

### Bloco 2 — Privacidade central + Busca Global @/$

4. **`src/pages/PrivacidadeCentral.tsx`** (rota `/privacidade`) — agrega num só lugar:
   - `PrivacyTab` (visibilidade biblioteca + exceções + grants já existentes).
   - `NotificationPrefsTab`, `BlockedUsersTab`, toggle `require_follow_approval`, toggle `is_private`, toggle "permitir mensagens de não-amigos".
   - Link a partir de `Perfil.tsx` ("Privacidade & Segurança →").
5. **`BuscaGlobal.tsx`** — parser de prefixos:
   - `@nome` → força aba Usuários, busca por `username`/`display_name`.
   - `$handle` → força aba Vendedores, busca por `seller_profiles.handle`.
   - Chip visual mostrando "Buscando usuário: @x" / "Buscando vendedor: $x" com botão limpar.

---

### Bloco 3 — Tutoriais práticos (não mais "só texto")

6. **Refatorar `Tutorial.tsx`** — cada tutorial vira **passo-a-passo interativo** com:
   - Stepper (1/N, próximo/anterior).
   - Mini-réplica funcional do componente real (ex.: tutorial de Biblioteca mostra 3 cards filler com botões "Mudar status", "Adicionar capa custom" funcionando localmente).
   - Tooltips destacando cada elemento.
   - Botão "Ir para a versão real" no final → marca `tutorials_seen`.
7. **`MConfig.tsx`** — adicionar seção "🎓 Tutoriais" listando os 6 tutoriais mobile, cada um abrindo `/tutorial/:key` específico (não um link genérico).
8. **`Tutoriais.tsx`** — separar visualmente Web vs Mobile com preview/descrição de cada um.

---

### Bloco 4 — Auditoria de páginas faltantes / configurações

9. **Fórum Geral** — hoje só existe `MForum` (por jogo) e `ForumAdmin` (desktop). Criar:
   - **`src/pages/ForumGeral.tsx`** (rota `/forum`) — lista todas categorias de `forum_categories` + posts recentes cross-game.
   - **`src/mobile/pages/MForumGeral.tsx`** (rota `/m/forum`) — mesma coisa em layout mobile. Hoje `/m/forum` cai num componente que assume produto.
   - Link no `Header` (web) e no bottom-nav (mobile).
10. **Configurações de grupos e chats:**
    - `MChatInfo` já existe; verificar se tem mute/block/leave. Adicionar o que faltar (mute notif, apagar histórico local, bloquear, sair).
    - `MGroupInfo` — adicionar: mute, sair do grupo, editar nome (se admin), transferir admin, link de convite.
11. **Página de Torneios** — `Torneios.tsx` existe; auditar e garantir que mostra: ativos, próximos, inscritos por mim, histórico. Adicionar filtro por jogo e CTA "Criar torneio" (se admin) / "Inscrever-se".
12. **`$vendedor` — onde configura/cria:**
    - Página `CriarVendedor.tsx` já existe (criação). 
    - Criar **aba "Vendedor" em `/perfil`** que mostra: se já é vendedor → mostra `SellerProfileSwitcher` + link "Gerenciar perfil $handle"; se não é → CTA "Tornar-se vendedor" → `/criar-vendedor`.
13. **Biblioteca social dos perfis-teste vazia** — o seed `seed-admin-friends` cria `biblioteca_usuario` mas talvez não emita timeline events nem set `is_public_in_library`. Vou:
    - Revisar `seed-admin-friends/index.ts` para também inserir `game_timeline_events`, `game_screenshots` (1-2 por amigo), 1 `reviews_completas`, 1 `game_opinions`, e marcar `library_visibility='public'` nos profiles dos amigos artificiais.
    - Redeployar a função; usuário re-roda o botão "Popular conta admin".

---

### Arquivos novos
- `src/components/perfil/CustomizacaoTab.tsx`
- `src/components/perfil/VendedorTab.tsx`
- `src/components/biblioteca/CustomCoverEditor.tsx`
- `src/pages/PrivacidadeCentral.tsx`
- `src/pages/ForumGeral.tsx`
- `src/mobile/pages/MForumGeral.tsx`
- `src/components/tutorial/TutorialStep.tsx` (stepper interativo)

### Arquivos editados
- `src/pages/Perfil.tsx` (novas abas Customização + Vendedor + link Privacidade)
- `src/pages/Biblioteca.tsx`, `src/pages/BibliotecaJogo.tsx` (usar capa custom)
- `src/pages/PublicProfile.tsx`, `src/pages/FriendProfile.tsx` (aplicar theme_color/cover/trophies)
- `src/pages/BuscaGlobal.tsx` (parser @/$)
- `src/pages/Tutorial.tsx`, `src/pages/Tutoriais.tsx` (passo-a-passo real)
- `src/mobile/pages/MConfig.tsx` (seção tutoriais específicos)
- `src/mobile/pages/MChatInfo.tsx`, `src/mobile/pages/MGroupInfo.tsx` (configurações faltantes)
- `src/pages/Torneios.tsx` (auditoria + filtros)
- `src/App.tsx` (rotas /privacidade, /forum, /m/forum-geral)
- `src/components/Header.tsx` + `src/mobile/MobileLayout.tsx` (links)
- `supabase/functions/seed-admin-friends/index.ts` (seed mais rico)

### Sem migração nova
Tudo usa schema/buckets existentes.

---

Posso seguir?