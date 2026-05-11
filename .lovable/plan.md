O PDF traz ~40 itens (fixes, admin desktop, loja web, mobile, torneios, XP, badges). Isso é trabalho de vários ciclos — vou executar em **fases**, validando cada uma antes de seguir.

## Fase 1 — Correções urgentes (esta rodada)
- **FIX-1**: Contagem real de jogos por categoria.
- **FIX-2**: Buraco transparente no chat mobile (header `MIDIAS` vazando atrás das mensagens — exatamente o que está circulado no screenshot). Corrigir o fundo do `MChatThread`.
- **ADMIN-1**: Mostrar `admin_notes` ao usuário quando sugestão de jogo é rejeitada (na `MReview` / `MForum`).

## Fase 2 — Sistema XP + Badges (base para várias features)
- Tabela `user_xp_log` (com limite diário por ação), `user_badges`.
- Trigger/Edge function para creditar XP em: review, post, comentário, like, troca, compra, torneios.
- Componente `LevelBadge` exibido em: perfil mobile, perfil público web, posts/comentários do fórum, card de bracket.
- Auto-desbloqueio dos badges STORE-10.

## Fase 3 — Moderação avançada (desktop)
- ADMIN-2: ver conteúdo denunciado + ações graduadas (apagar / ban temporário com duração / ban permanente) + notificação ao usuário com motivo.
- ADMIN-3: histórico de moderação por usuário.
- ADMIN-4/5/6: fórum, notificações e avaliações agrupados por jogo/usuário no desktop.
- ADMIN-7: filtros por categoria/cargo nas listagens grandes (com "Mostrar todos").

## Fase 4 — Loja web
- STORE-1: notificar wishlist em queda de preço/lançamento.
- STORE-2: preview de reviews + CTA "Ver tudo no app" na página do jogo.
- STORE-3 / STORE-4: histórico de preços (tabela `price_history` + trigger) + badge "Menor preço histórico".
- STORE-5/6: promoções relâmpago com timer + bundles (ADMIN-11/12 no desktop).
- STORE-7: destaque por gênero (3+ jogos na biblioteca).
- STORE-8: página "Em Alta".
- STORE-11: seção "Pra Você" baseada em regras.
- STORE-12: Daily Pick (auto + ADMIN-8 override manual).
- STORE-13: página Social (feed amigos, jogando agora, em comum, recomendações diretas).

## Fase 5 — Torneios (ADMIN-9/10/13 + STORE-14 + MOBILE-5/6)
- Tabelas: `tournaments`, `tournament_participants`, `tournament_matches`, `tournament_results`.
- Admin desktop cria torneio, valida resultados, confirma vencedor (credita prêmio + badge + XP).
- Web: página de torneios (Abertos / Em andamento / Encerrados / Meus) + bracket visual.
- Mobile: chat de confronto auto-criado (categoria vermelha) + thread oficial no fórum auto-atualizada.
- Regras: 2 tipos (semanal/mensal), cooldown de 4 semanas por participação, calendário público só dos mensais.

## Fase 6 — Mobile
- MOBILE-1: central de notificações (ícone de sino na home, agrupada, preferências por tipo).
- MOBILE-2: aba "Pedidos de amizade" no perfil.
- MOBILE-3: contadores de likes/comentários inline na listagem do perfil.
- MOBILE-4: barra de busca por usuário no fórum (lista comentários dele em todos os fóruns).

---

## Detalhes técnicos resumidos
- Migrations novas: `categorias_count_fix` (RPC ou view), `xp_log`, `user_badges`, `price_history`, `bundles`, `tournaments*`, `wishlist_notifications`, `mod_history`, `daily_pick_override`, `notification_preferences`, `friend_requests`.
- Triggers: XP creditado por ação com `UNIQUE(user_id, action, date)` para limite diário (exceto compra).
- Edge functions: `award-xp`, `process-tournament-match`, `daily-pick-rotation` (cron).
- Realtime já habilitado nas tabelas `notifications`, `messages` — reusar.

---

## Como vou proceder
Começo **agora pela Fase 1** (3 fixes pequenos, alta visibilidade — o buraco do chat é o que aparece no seu print). Ao terminar, peço sua confirmação antes de seguir para Fase 2 (XP), que é a fundação de várias outras. Se quiser priorizar outra fase primeiro (ex: pular direto pra torneios ou pra loja), me diga agora.
