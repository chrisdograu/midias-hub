## Encerramento Fase 1 — Chat

**MChatThread + MGroupChat**
- Reply: toque longo / botão "responder" → mostra preview da msg citada acima do input; envia `reply_to_id`. Render: bloco quotado no topo do balão clicável (scrolla até a msg original).
- Reações emoji: tap-hold abre popover com `👍 ❤️ 😂 😮 😢 🎮`; grava em `message_reactions` (1 por user por msg). Render: chips agregados abaixo do balão; tocar remove a sua.
- Realtime: canal já existe — adicionar listener em `message_reactions` (escopo por `message_id IN msgs`).

*Sem novo SQL — colunas/tabelas já existem.*

## Encerramento Fase 2 — Marketplace

**Migration** (1 só): adicionar `anuncios.condition` (text, default 'usado', NOT NULL com backfill) — valores: `novo|seminovo|usado|recondicionado`. Index em `(status, expires_at, condition, price)`.

**MNewAd**: seletor obrigatório de **Condição** (4 chips) + incluir no `completude` (passa a ser 0/7). Bloqueia publicação se ausente.

**MMarketplace**: 
- Filtro por condição (chips).
- Range slider de preço máx + ordenação (recentes / preço asc / preço desc).
- Mostrar selo de condição no card.

**MMarketplaceItem**: importar `PriceHistoryChart` existente (já está em `src/components/`) com `price_history` filtrado por `anuncio_id` (se houver) ou por jogo equivalente.

**AnunciosAdmin**: card "Configurações globais" — input `max_active_ads_uncertified` (default 5) salvo em `site_settings`. Trigger SQL `enforce_uncertified_ad_limit` que valida no `BEFORE INSERT` em `anuncios` quando `has_active_certificate(seller_id) = false`.

## Fase 3 — Torneios (completa)

**Migration**:
- `tournaments.stream_url text`
- `tournaments.default_format`, `default_bo`, `walkover_minutes` (preencher defaults p/ todos)
- `tournament_bans (tournament_id, user_id, banned_by, reason, created_at)` + GRANTs + RLS (apenas mods inserem; participante vê o próprio ban) + trigger que impede re-inscrição do user banido.

**Pages**:
- `Torneios.tsx` (web): card mostra "🔴 AO VIVO" + link quando `stream_url` ativo.
- `TournamentMatch.tsx`: nova seção "Histórico entre os jogadores" — query `tournament_matches` onde os dois jogadores se enfrentaram (W/L/última partida).
- `CinematicBracket.tsx`: badge de stream no header.
- Desktop `Torneios.tsx`: aba "Regras padrão" (formato BO, walkover timer, prêmios cosméticos via `game_rewards`) + lista de banidos por torneio com botão "remover ban".
- `TournamentRegistration.tsx`: erro amigável quando banido.

**Push reminders**: edge function `tournament-reminders` já existe — estender para também disparar em T-1h e T-15min (3 janelas), gravar em `tournament_reminder_log` para deduplicar.

## Princípio mantido

Tudo configurável: limite de anúncios, regras padrão de torneio e lista de banidos têm UI no Desktop.

## Ordem de execução

1. Migrations (3 chamadas separadas: marketplace, torneios, função de limite). 
2. UI Chat (reply + reactions).
3. UI Marketplace (filtros + condição + gráfico).
4. UI Torneios (stream + H2H + bans + admin defaults).
5. Estender edge function de reminders.

Aprova prosseguir?
