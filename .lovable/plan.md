# Plano de correção — estado atual

## ✅ Concluído nesta rodada

### Owner de grupo real (decisão 1)
- Coluna `groups.owner_id` (FK profiles), backfill de `created_by`.
- `is_group_owner(grupo, usuario)` helper.
- Trigger de sucessão reescrito: quando o dono sai, promove admin mais antigo → membro mais antigo → apaga grupo vazio.
- Policy `Owner deletes group` para o dono apagar o próprio grupo.

### Modo Live de torneio estilo Twitch (decisão 4)
- Colunas em `tournaments`: `live_state` (idle/live/paused/ended), `live_started_at`, `live_current_topic`, `live_stream_platform`.
- Tabela `tournament_live_events` (feed em tempo real; kinds: live_started, live_paused, live_resumed, live_ended, stream_changed, topic_changed, commentary, highlight, announcement).
- RPCs `tournament_set_live_state` e `tournament_post_live_message` (só admin/mod).
- Realtime habilitado em `tournament_live_events`.
- Componente `TournamentLivePanel`:
  - Público: banner AO VIVO + embed seguro do stream (Twitch/YouTube/Kick) + feed em tempo real de comentários/highlights/anúncios.
  - Admin/mod: painel de controle (iniciar/pausar/retomar/encerrar, trocar URL, mudar tópico, publicar comentário/highlight/anúncio).
- Integrado em `TournamentEvent.tsx`.

### Preferências de notificação respeitadas
- Função `should_notify(uid, pref)` centraliza a leitura de `notification_preferences` (default opt-in).
- Triggers atualizados: `notify_mention`, `notify_review_comment`, `notify_opinion_reply`, `notify_friends_review_completa`, `notify_waitlist_promoted`, `notify_promoted_to_participant`.

### SEO dinâmico
- Hook `useDocumentMeta` (title + description + OG + Twitter Card, restaura no unmount).
- Aplicado em `PublicProfile`. Padrão pronto para replicar em `SellerProfile`, `GameDetail`, `TournamentEvent`.

### Já resolvido em rodadas anteriores
- Sprint 0 (vazamento profiles + CPF/telefone blindados por GRANT de colunas + RPC `get_public_profile` + testes).
- Sprints 1–4 (dedupe views, cupom com lock, EmAlta unificado, QueryErrorBoundary, curadoria de destaques, limpeza de rotas, `manage-employee` com signOut, HIBP habilitado).

## Decisões registradas

- **JogosAdmin × Produtos (decisão 2)**: `Produtos` é a fonte única de catálogo (funciona para qualquer categoria futura). `JogosAdmin` fica como visão especializada para atributos *específicos de jogos* (gênero, plataforma, hype). Sem migração de dados — só posicionamento na UI. Ajuste de cópia do header pendente como polimento (baixo risco).
- **opinion_mutes × blocked_users (decisão 3)**: mantidos separados. `opinion_mutes` é feature local por opinião; `blocked_users` é bloqueio global. Sem mudanças.

## ⏳ Pendências residuais (baixo risco / polimento)

1. Aplicar `useDocumentMeta` também em `SellerProfile`, `GameDetail`, `TournamentEvent` (cópia direta do padrão do PublicProfile).
2. Sanitize dos `<style dangerouslySetInnerHTML>` em `ProfileCosmeticOverlay` / `GamePageCosmeticOverlay`: validar `accent.payload.color` com regex `^#[0-9a-fA-F]{6}$` antes de injetar, e validar `ownerId` como UUID no seletor.
3. Ajustar cópia do header de `JogosAdmin.tsx` deixando claro "atributos específicos de jogos" (Produtos = fonte única).
4. 2FA para admins — fluxo maior, ficou fora desta rodada.
5. Warnings do linter Supabase (198 pré-existentes) — auditar quais SECURITY DEFINER podem ter EXECUTE revogado de `anon`.
