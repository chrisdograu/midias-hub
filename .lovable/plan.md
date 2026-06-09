# Plano — Rodada Final (6 sub-rodadas)

São muitos pedidos. Vou dividir em 6 sub-rodadas executáveis. Confirme e eu executo **todas** em sequência neste mesmo fluxo.

## Esclarecendo dúvidas que você levantou
- **"Paginação/ordenação universais com filtros persistidos"** = toda página admin terá: controles de ordenar coluna ↑↓, paginação (20/pág, Anterior/Próxima), e os filtros (busca, status, datas) ficam salvos em `localStorage` por página, então ao sair e voltar tudo continua como estava.
- **"Tela de detalhes com timeline"** = clicar em uma linha (denúncia, ban, jogo, troca, ticket) abre painel lateral mostrando todos os `admin_logs` daquele `entity_id` em ordem cronológica (quem fez, quando, motivo).
- **"IntegracoesAdmin completa"** = sair do placeholder; tabela `integration_webhooks` (url, evento, secret, ativo), CRUD, botão "Testar conexão" (faz POST de ping e mostra status), export CSV, tudo logado.

---

## Rodada 1 — Backend (migrations)
1. `tournament_chat_messages` já existe → adicionar índice por tournament_id+created_at e habilitar realtime para histórico/paginação.
2. Novas tabelas:
   - `tournament_waitlist` (tournament_id, user_id, position, created_at)
   - `tournament_confirmations` (tournament_id, user_id, stage `7d|1d|1h`, confirmed_at, expires_at)
   - `integration_webhooks` (name, url, event, secret, active, created_by)
   - `forum_categories` (slug, name, order, is_community) + seed "Comunidade" com 4 subcategorias
   - `review_completa_visibility` (review_id, user_id) para lista personalizada
   - Adicionar em `tournaments`: `kind` (`weekly|monthly`), `entry_price`, `prize_distribution` (jsonb), `refund_policy_ack`.
   - Adicionar em `biblioteca_usuario`: `badge_completed`, `badge_platinum`, `badge_verified_source`.
3. Trigger `revoke_seat_on_missed_confirmation()` + libera próximo da fila.
4. Função `award_xp` ajustada para nova tabela de níveis (1→17 com Rei do 67 / Imperador do 67).
5. Bloquear criação de anúncio sem `seller_profile`: policy em `anuncios` exigindo `EXISTS seller_profiles WHERE user_id=auth.uid()`.

## Rodada 2 — Admin universal
- Helper `useAdminTable` (busca+filtros+sort+page persistidos em localStorage).
- Helper `requireAdminAction(scope)` — se papel não pode, registra `admin_logs.action='denied_*'` e mostra toast.
- Aplicar nas 18 páginas admin (JogosAdmin, BundlesAdmin, Denuncias, etc).
- Painel lateral `<EntityTimelineDrawer entity entity_id />` lendo `admin_logs`.
- IntegracoesAdmin: CRUD real + "Testar conexão" + export.

## Rodada 3 — Torneio Mensal Pago
- `CreateTournamentDialog`: campo kind, entry_price, editor de distribuição (1º/2º/3º + margem calculada ao vivo).
- Página de inscrição (`/torneios/:id/inscrever`): checkbox 18+, regras de reembolso visíveis, simulação de pagamento (Pix/Cartão como no checkout simulado da loja).
- Fila de espera: botão "Entrar na fila", lista ordenada, notificação quando vaga abre.
- Edge function `tournament-reminders` (já existe): expandir para mandar 7d/1d/1h com botão de confirmar + liberar vaga + reembolso 50%.

## Rodada 4 — Detalhe de torneio + chat persistente
- `TournamentDetail.tsx`: ranking (vitórias/derrotas/pontos), estatísticas (participantes, MVP, predições), timeline de eventos (`tournament_match_events`).
- `LiveTournamentChat`: persistir em `tournament_chat_messages`, paginação infinita (cursor created_at), barra de busca por texto.

## Rodada 5 — Social/Biblioteca
- `OpinionsPanel` + `ScreenshotsPanel` em `FriendProfile` e `SocialLibrary` com mesmo `ItemActionsMenu` e privacidade.
- `BibliotecaJogo`: ao mudar status/marcar conquista, criar `game_timeline_events` + entrada no `social_content_states` que o `GameTimeline` e MHome consomem como "momento de amigo".
- Sistema de status com 7 valores + insígnias Completado/Platinado (canto direito do card), respeitando `badge_verified_source`.

## Rodada 6 — Fórum Geral + Review Completa Web + XP
- Fórum: categoria "Comunidade" fixa no topo do MForum com 4 subcategorias.
- Review Completa: botão "Criar Review Completa" em `BibliotecaJogo` (web) para jogos com status ≠ "Quero Jogar"; já existe `ReviewCompletaEditor` — só ligar visibilidade (`friends` ou `custom_list`).
- Atualizar tabela de níveis no `award_xp` e em qualquer UI que liste níveis (LevelBadge tooltip).

---

**Pode dar OK que eu rodo as 6 sub-rodadas em sequência?** Vou começar pela Rodada 1 (migrations) — depois que você aprovar a migration, sigo direto nas demais sem parar.
