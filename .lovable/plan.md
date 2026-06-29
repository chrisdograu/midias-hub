# Plano geral — pós-auditoria

## 0. Bug crítico (já corrigido nesta resposta)

**Erro**: `cannot add postgres_changes callbacks ... after subscribe()` no canal `ugr-<user-id>` — quebrava `/m/perfil` (tela em branco).

**Causa**: `CosmeticUnlocksCenter` está montado no `MobileLayout` (global). React StrictMode remonta o efeito; o `removeChannel` é assíncrono, então o segundo mount reutiliza o mesmo canal já-subscrito e tenta adicionar `.on()` de novo.

**Fix aplicado**: sufixo aleatório no nome do canal (`ugr-<id>-<rand>`) — garante canal novo em cada mount sem colidir com o anterior em remoção. Aplicar o mesmo padrão se outros canais globais derem o mesmo sintoma.

---

## Princípio transversal

> **Tudo que for adicionado tem CRUD/configuração na página de admin correspondente do Desktop.** Sem exceções. Cada feature abaixo lista a página admin que recebe os controles.

---

## Fase 1 — Chat (alto impacto, baixo custo)


| Item                                                                                                                                     | Onde                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Foto/anexo único por mensagem (upload inline, preview, lightbox)                                                                         | `MChatThread`, `MGroupChat`                     |
| Reply/citação de mensagem                                                                                                                | mesmas telas + coluna `reply_to` em `mensagens` |
| Indicador "digitando…" (presence)                                                                                                        | `MChatThread`                                   |
| Reações emoji (1 por user por msg)                                                                                                       | nova tabela `message_reactions`                 |
| Limpar conversa / arquivar                                                                                                               | `MChatInfo`                                     |
| **Admin**: `MensagensAdmin` ganha aba "Configurações de chat" — tamanho máx anexo, lista de emojis permitidos, toggle de presence global | &nbsp;                                          |


## Fase 2 — Marketplace (fechar gaps do documento aprovado)


| Item                                                                                                                                      | Onde                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Selo de **Condição** obrigatório + filtro                                                                                                 | `MNewAd`, `MMarketplace`                               |
| Filtro de preço máx + ordenação preço asc/desc                                                                                            | `MMarketplace`                                         |
| **Modo Férias** (oculta anúncios do vendedor)                                                                                             | `VendedorConfig` + flag em `seller_profiles`           |
| Barra de **Completude** 0/6 do anúncio (foto, condição, descrição ≥40 chars, preço, plataformas, formas de troca)                         | `MNewAd`                                               |
| Expiração 30/60/90 dias + renovação 1-clique                                                                                              | coluna `expires_at` em `anuncios` + cron edge function |
| Limite de anúncios ativos por vendedor não-certificado (default 5)                                                                        | regra em `AnunciosAdmin`                               |
| Histórico de preço do próprio anúncio (já existe `price_history`) — gráfico no detalhe                                                    | `MMarketplaceItem`                                     |
| **Admin**: `AnunciosAdmin` recebe: limite global de anúncios, dias padrão de expiração, lista de condições, toggle do modo férias forçado | &nbsp;                                                 |


## Fase 3 — Torneios


| Item                                                                                                                           | Onde                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Stream/link ao vivo no card                                                                                                    | `Torneios`, `CinematicBracket` |
| Histórico do confronto entre 2 participantes                                                                                   | `TournamentMatch`              |
| Notificação push antes do match (já há `tournament-reminders`) — ampliar para 1h, 15min                                        | edge function existente        |
| Banimento de participante por moderador                                                                                        | `tournament_moderators`        |
| **Admin**: `Torneios.tsx` (desktop) ganha "Regras padrão" (formato, BO, walkover timer, prêmios cosméticos via `game_rewards`) | &nbsp;                         |


## Fase 4 — Lojão oficial (E-commerce Web)


| Item                                                                                                | Onde                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Wishlist com alerta de queda de preço                                                               | `Favoritos` + edge function diária                       |
| Bundle dinâmico "compre 2, leve 3"                                                                  | `BundlesAdmin` (já existe) — adicionar regra de gratuito |
| Recomendação "quem comprou X levou Y"                                                               | `GameDetail` + view materializada                        |
| Comparador lado-a-lado de até 3 jogos                                                               | nova rota `/comparar`                                    |
| **Admin**: `Produtos` ganha aba "Cross-sell" + `Promocoes` ganha tipo "queda de preço dispara push" | &nbsp;                                                   |


## Fase 5 — Fórum / Comunidade


| Item                                                                        | Onde                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| Hashtags + busca por hashtag                                                | composer + `MForum` + página `/m/forum/tag/:tag` |
| Salvar post (bookmark)                                                      | nova tabela `forum_bookmarks`                    |
| Threads fixadas pelo moderador                                              | flag `is_pinned`                                 |
| **Admin**: `ForumAdmin` ganha gerência de hashtags em destaque e pin global | &nbsp;                                           |


## Fase 6 — Perfil / Biblioteca


| Item                                                                                | Onde                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Diário de jogos: status público (jogando/zerado/dropei) com data                    | `biblioteca_usuario` já tem `status` — expor no `PublicProfile` |
| Listas personalizadas ("Top 10 de 2025")                                            | nova tabela `user_lists` + `MProfile`/`Perfil`                  |
| Pin de até 3 reviews na home do perfil                                              | flag em `reviews_completas`                                     |
| **Admin**: `BibliotecaSocialAdmin` ganha controle de visibilidade global das listas | &nbsp;                                                          |


## Fase 7 — Vendedor


| Item                                                         | Onde              |
| ------------------------------------------------------------ | ----------------- |
| Métricas: visualizações, propostas, conversão                | `VendedorConfig`  |
| Resposta automática "fora do horário"                        | `seller_profiles` |
| Selo "responde rápido" (calculado em `mensagens`)            | trigger + badge   |
| **Admin**: `Certificados` ganha aba "Métricas de vendedores" | &nbsp;            |


---

## Ordem sugerida de execução

1. **Fase 1 (Chat)** — você sinalizou que é prioridade implícita.
2. **Fase 2 (Marketplace)** — fecha o documento aprovado anteriormente.
3. **Fase 3 (Torneios)** + **Fase 4 (Lojão)** em paralelo (áreas independentes).
4. **Fase 5–7** — refinamento contínuo.

Cada fase é entregável sozinha. Posso começar pela Fase 1 já? faça fase 1 e 2