
# Plano em duas etapas

## ETAPA 1 — Fechar pendências da rodada anterior

Itens do prompt unificado anterior que ainda não foram entregues. Vou implementar antes de tocar no documento novo.

### 1.1 UI de Privacidade Granular (Web — Perfil)
- Nova aba **Privacidade** em `src/pages/Perfil.tsx`:
  - Toggle global `library_visibility` (público / amigos / privado)
  - Lista de **exceções** (`profiles.privacy_exceptions`) — buscar amigo e adicionar
  - Por exceção: checkboxes de escopo gravados em `privacy_grants` (reviews_completas, screenshots, opinions, stats, achievements, library_items, full)
- Reaproveitar `can_view_scope` já existente no banco.

### 1.2 Feed Mobile 40/30/30 + "Não mostrar mais este jogo"
- Refactor de `src/mobile/pages/MHome.tsx`:
  - Três pools: biblioteca do usuário (40%), jogos de gêneros similares (30%), global (30%)
  - Excluir tudo de `user_game_mutes` com escopo `feed|both`
  - Intercalar mantendo proporção
- Botão "Não mostrar mais conteúdo deste jogo" em `MForumGame.tsx`, `BibliotecaJogo.tsx` e `FriendProfile.tsx` (insere em `user_game_mutes`).

### 1.3 Múltiplas imagens em Bundles
- Adicionar coluna `images text[]` em `bundles` (migration).
- Renderizar galeria em `src/pages/BundleDetail.tsx` via `ProductGallery`.
- Garantir uso de `ProductGallery` em `GameDetail.tsx` (já existe `produto_imagens`).

---

## ETAPA 2 — Documento novo (Painel Admin + Sistemas Sociais)

Implementação faseada. Cada fase é independente e termina entregando UI utilizável.

### Fase A — Reestruturação da navegação do Desktop Admin
Sidebar agrupada conforme spec:
- Dashboard
- **Cadastros**: Produtos, Funcionários, Clientes, Fornecedores, Categorias
- **Comercial**: Cupons, Promoções, **Bundles** (nova página `BundlesAdmin.tsx`)
- **Jogos**: Jogos (estado: Ativo/Oculto/Somente Fórum/Somente Loja/Descontinuado), Solicitações, **Criar Jogo**
- **Marketplace**: Anúncios, **Trocas**, **Trocas Arquivadas**, Avaliações Comerciais
- **Biblioteca Social** (admin viewer — read-only com justificativa)
- **Torneios**: Eventos (histórico), Atuais, Criar Torneio
- Moderação / Denúncias (separados)
- **Tickets**: Mobile (chat) / Web (email)
- Notificações (comum, destacada, especial com banner/CTA)
- **Análises e Auditoria**: Analytics, Relatórios, **Logs Administrativos** (com reverter — só admin geral)
- **XP e Recompensas**: Mobile, Web, Badges, Títulos, Recompensas
- Certificados: Solicitações / Ativos / Retidos
- Integrações (Steam, Xbox, PSN, Discord, Twitch, YouTube)
- Configurações

### Fase B — Schema novo para suportar o doc
Migrations:
- `produtos.estado_publicacao` enum (`ativo|oculto|somente_forum|somente_loja|descontinuado`)
- `admin_logs` (admin_id, action, entity, entity_id, reason, payload jsonb, reverted_by, reverted_at) — trigger genérico via wrappers
- `tickets` (user_id, channel `mobile|web`, status, subject, body, attachments[]) + `ticket_messages`
- `social_content_states` (user_id, content_type, content_id, state `novo|visto|curtido|oculto`) — único por (user, type, id); regra "uma vez novo"
- `social_favorites` (user_id, content_type, content_id)
- `game_timeline_events` (user_id, product_id, kind, payload, created_at)
- `notification_preferences` granular (categorias do doc)
- `notifications.kind` enum (`comum|destacada|especial`) + colunas `banner_url`, `cta_label`, `cta_url`
- `friendship_state` view derivada de `user_follows` (mútuo = amizade); trigger que quando alguém deixa de seguir remove acessos
- `biblioteca_usuario.status` enum expandido (`jogando|pausado|zerado|platinado|abandonado|quero_jogar`) + `is_favorite`

### Fase C — Sistemas sociais novos
- **Estados NOVO/VISTO/CURTIDO/OCULTO** com regra de não-repetição (trigger bloqueia voltar para "novo").
- **Timeline por jogo** em `FriendProfile.tsx` → aba Timeline.
- **Histórico agregado por jogo** na Biblioteca Social.
- **Favoritos sociais** (aba nova em `SocialLibrary.tsx`).
- **Bloqueio bilateral**: estender `blocked_users` para bloquear menções, convites a grupo, visualização de reviews públicas.
- **Menção visual** `@user` com cartão (avatar + nome + handle) — componente `MentionAutocomplete.tsx` reutilizado em fórum, reviews, comentários, chats, grupos.
- **Notificações personalizáveis** por categoria + **MIDIAS Especiais** com banner/CTA.
- **Amizade ao deixar de seguir**: revoga acessos privados, mantém público.

### Fase D — Páginas Admin novas
- `BundlesAdmin.tsx`, `TrocasAdmin.tsx`, `TrocasArquivadas.tsx`, `AvaliacoesComerciais.tsx`
- `JogosAdmin.tsx` (substitui `Produtos.tsx` para o domínio jogos, com estado de publicação)
- `BibliotecaSocialAdmin.tsx` (viewer read-only com justificativa obrigatória → log)
- `TorneiosEventos.tsx`, `TorneiosAtuais.tsx`, `CriarTorneio.tsx`
- `TicketsMobile.tsx` (chat), `TicketsWeb.tsx` (email)
- `NotificacoesEspeciais.tsx` (criação com banner/CTA)
- `LogsAdministrativos.tsx` (com botão Reverter — só `admin_geral`)
- `XPMobile.tsx`, `XPWeb.tsx`, `BadgesAdmin.tsx`, `TitulosAdmin.tsx`, `RecompensasAdmin.tsx`
- `IntegracoesAdmin.tsx`

---

## Observações
- Escopo enorme; cada fase será uma rodada separada para manter qualidade.
- Vou começar pela **Etapa 1** inteira + **Fase A** (sidebar) + **Fase B** (migrations) nesta rodada.
- Fases C e D nas rodadas seguintes.
- Sem cores hardcoded — tokens semânticos do design system.

**Confirma para eu prosseguir nesta ordem, ou quer reordenar/recortar?**
