## Escopo deste lote

Vou entregar tudo descrito no prompt unificado em uma única rodada. Como é grande, divido em blocos. Confirme se algum bloco deve ser cortado ou priorizado.

---

### Bloco A — Lembretes automáticos de torneio (pendência da fase anterior)
- Edge Function `tournament-reminders`: varre torneios com `starts_at` em ~7d / ~1d / ~1h e cria notificações para cada participante (uma vez por janela, controlado por nova tabela `tournament_reminder_log`).
- Cron job (pg_cron + pg_net) executando a cada 15 min.

---

### Bloco B — Fase 1.5: Opiniões & Screenshots (Web)
Novas tabelas:
- `game_opinions` (user_id, product_id, text, images[], likes_count, replies_count)
- `game_opinion_replies` (opinion_id, sender_id, recipient_id, text, images[]) — conversa **privada par a par** (autor ↔ respondente). Outros amigos só veem contagem.
- `game_opinion_likes`, `game_opinion_mutes_user`, `game_opinion_mutes_game`
- `game_screenshots` já existe parcialmente como `game_clips` — vou criar `game_screenshots` dedicada (imagens + descrição, só curtidas, sem replies) + `game_screenshot_likes` + mutes.

UI Web:
- `OpinionsPanel.tsx` e `ScreenshotsPanel.tsx` integrados em `BibliotecaJogo.tsx`, `FriendProfile.tsx` (rota /perfil/:id/jogo/:pid) e `SocialLibrary.tsx`.
- Menu de ações (denunciar, copiar, silenciar jogo, silenciar usuário) via `ItemActionsMenu`.
- Conversa privada renderizada como mini-chat embutido na Opinião quando o viewer é autor ou respondente.

Feed da Biblioteca Social ganha filtros: Tudo / Reviews / Opiniões / Screenshots / Atividades.

---

### Bloco C — Privacidade granular
- `profiles.library_visibility` (`public|friends|private`) + `profiles.privacy_exceptions` (uuid[]) — usuários que sempre veem tudo mesmo quando privado.
- Tabela `privacy_grants` (owner_id, viewer_id, scope) com escopos: `reviews_completas`, `screenshots`, `opinions`, `stats`, `achievements`, `library_items` — para o modo granular do Web.
- Atualizar `can_view_friend_content` para checar exceções e grants.
- UI na página de Perfil: aba "Privacidade" com toggle global + lista de exceções e, por exceção, checkboxes de escopo.

---

### Bloco D — Menções: restringir notificações
- Atualizar trigger `notify_mention`: só dispara notificação quando `source_type` ∈ {`forum_post`, `forum_reply`, `review`, `review_comment`, `group_message`}. Menções em chat privado e em grupos onde o usuário não é membro não notificam (checa `group_members`).

---

### Bloco E — Feed mobile 40/30/30 + "Não mostrar mais este jogo"
- Tabela `user_game_mutes` (user_id, product_id, scope `feed|social_library|both`).
- Refactor de `MHome.tsx` para montar feed com três pools (biblioteca / gêneros similares / global) e intercalar conforme proporção, excluindo jogos mutados.
- Botão "Não mostrar mais conteúdo deste jogo" em `MForumGame.tsx` e em `BibliotecaJogo.tsx`/`FriendProfile.tsx` (escopo web aplica em `social_library`).

---

### Bloco F — Múltiplas imagens em jogos e bundles
- `produto_imagens` já existe; garantir uso de galeria/carrossel em `GameDetail.tsx`, `BibliotecaJogo.tsx`, `MMarketplaceItem.tsx` e `BundleDetail.tsx` via `ProductGallery`.
- Adicionar coluna `images text[]` em `bundles` + UI admin (`BundleStoreGrid` já mostra capa; adicionar galeria em `BundleDetail`).

---

### Riscos / observações
- Volume muito grande para uma única rodada; pode haver retrabalho iterativo após você testar.
- Vou usar tokens semânticos do design system existente (sem cores hardcoded).
- Migrações virão em arquivos separados por bloco para facilitar rollback.

---

**Confirma para eu prosseguir com tudo, ou quer recortar algum bloco?**
