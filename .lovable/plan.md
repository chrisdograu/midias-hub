# Plano — Spoilers + Recompensas Cosméticas

## Parte 1 — Spoilers no fórum (corrigir bug)

Hoje existe `SpoilerGuard` e colunas `is_spoiler` / `achievement_lock` em `forum_posts`, mas **nenhuma UI** marca o post como spoiler nem exibe o guard ao ler. Por isso "não consigo colocar spoiler".

### Onde adicionar

- **Criação de post (mobile)**: `MForumGame.tsx`, `MForumComunidade.tsx`, `MForum.tsx` — composer ganha:
  - Toggle "⚠️ Marcar como spoiler" (manual — todos precisam clicar pra ver).
  - Select opcional "Trancar por conquista" → lista as conquistas do jogo atual (`user_achievements` que existem no catálogo do produto). Só aparece em fóruns vinculados a um jogo.
- **Leitura**: envolver o conteúdo de cada post em `<SpoilerGuard isSpoiler={p.is_spoiler} achievementLockId={p.achievement_lock}>` nas listagens (`MForum`, `MForumGame`, `MForumComunidade`, `MForumPost`, `ForumGeral`).
- **Reviews**: mesma dupla de controles no editor de review (`MReview.tsx`) — já existe coluna em `avaliacoes`.

### Resultado

- Manual: qualquer leitor vê blur + "Toque para revelar".
- Por conquista: leitores sem a conquista vêem blur; quem tem, vê direto.

---

## Parte 2 — Recompensas cosméticas por jogo (admin)

Sistema novo: admin cadastra **rewards** (cosméticos) por jogo, com critério de desbloqueio. Usuário desbloqueia ao cumprir o critério (zerar, platinar, X reviews do jogo, X posts no fórum do jogo, etc.). Recompensas são **cumulativas** e aplicáveis ao perfil global E à página do jogo (do jogo origem **ou** de qualquer outro jogo onde ele aparece — ex: card raro de Zelda pode decorar a página do Elden Ring que ele também joga).

### Tipos de cosmético (`reward_kind`)

1. `avatar_frame` — moldura/borda animada do avatar
2. `profile_banner` — banner do perfil
3. `profile_accent` — cor de destaque
4. `game_card_skin` — skin do card do jogo na biblioteca/perfil
5. `game_page_theme` — tema da página de jogo (bg, partículas, accent)
6. `character_icon` — ícone de personagem (pode virar avatar ou decorar cards)
7. `sticker` — adesivo colável em posts/reviews/perfil

### Critérios de desbloqueio (`unlock_criteria` jsonb)

- `{ type: 'completed', product_id }` — zerou o jogo
- `{ type: 'platinum', product_id }` — platinou
- `{ type: 'playtime', product_id, min_hours }`
- `{ type: 'reviews_for_game', product_id, count }`
- `{ type: 'forum_posts_for_game', product_id, count }`
- `{ type: 'achievement', achievement_name | product_id }`

### Schema novo

```text
game_rewards            (id, product_id, kind, name, description,
                         asset_url, payload jsonb, unlock_criteria jsonb,
                         rarity, created_at)
user_game_rewards       (user_id, reward_id, unlocked_at)  -- inventário
user_cosmetic_loadout   (user_id, slot, reward_id)
                         -- slots: 'avatar_frame','profile_banner',
                         -- 'profile_accent','sticker_1..3'
user_game_page_loadout  (user_id, product_id, slot, reward_id)
                         -- por página de jogo, escolhe quais cosméticos exibir
                         -- (qualquer reward desbloqueado, vindo de qualquer jogo)
```

Função `check_game_reward_unlocks(_user, _product)` rodada via trigger nos eventos: `biblioteca_usuario.status`, `avaliacoes`, `forum_posts`, `user_playtime`, `user_achievements`. Insere em `user_game_rewards` quando bate o critério; cria notificação "🎁 Você desbloqueou X em &nbsp;".

### Admin (Desktop)

- **Nova aba na `JogosAdmin` → "Recompensas do jogo"** (drawer no item ou tab no editor):
  - Lista `game_rewards` daquele produto, CRUD completo.
  - Form: tipo, nome, descrição, upload de asset (bucket `game-rewards`), payload visual (cor/css/animação preset), seletor de critério.
  - Preview ao vivo do cosmético (mini avatar + mini game card).

### UI usuário

- **Perfil → nova aba "Cosméticos"** (estende `CustomizacaoTab`): grid do inventário (`user_game_rewards`) agrupado por jogo de origem, com filtro por tipo. Equipar = grava em `user_cosmetic_loadout`.
- **Página do jogo (`GameDetail` + `BibliotecaJogo` + `GameSocialHub`)**: novo botão "🎨 Personalizar esta página" (só dono da biblioteca) — modal escolhe banner/theme/stickers desse jogo a partir de **qualquer** reward desbloqueado.
- **Renderização pública**: ao visitar `PublicProfile`/`FriendProfile`/`SellerProfile`, aplicar loadout global. Ao visitar `GameDetail` de outro usuário (ex: vendor page), aplicar loadout daquele jogo se houver.
- `GameCard` ganha overlay opcional de skin/frame.
- `Header`/`MobileLayout` avatar respeita `avatar_frame`.

### Cumulatividade

- Nada é consumido. `user_game_rewards` é append-only.
- Loadout (`user_*_loadout`) escolhe o que está visível em cada superfície; resto fica no inventário.

---

## Parte 3 — Ordem de execução

1. **Fix spoilers** (Parte 1) — pequeno, resolve a queixa imediata.
2. **Migration**: cria `game_rewards`, `user_game_rewards`, `user_cosmetic_loadout`, `user_game_page_loadout`, bucket `game-rewards`, triggers de desbloqueio.
3. **Admin CRUD** em `JogosAdmin` (Desktop).
4. **Inventário + loadout** em `CustomizacaoTab` (perfil) e modal de personalização na página de jogo.
5. **Renderização**: aplicar cosméticos em `GameCard`, avatar, banner, página de jogo.

---

## Perguntas antes de começar

1. Faço **tudo** (Parte 1 + 2 + 3) numa tacada? Ou só Parte 1 (spoiler) agora e Parte 2/3 num próximo passo? Parte 2 é grande — ~6-8 arquivos novos + migration densa.
2. Os assets dos cosméticos (frames, banners, stickers) — eu **gero placeholders SVG/CSS** programáticos pra começar, ou você quer fazer upload de PNG/GIF reais via admin desde o início?
3. Para o "loadout por página de jogo" (personalizar a página de cada jogo da minha biblioteca individualmente) — o usuário precisa ter o jogo na biblioteca pra customizar, certo? E só ele vê essa customização, ou amigos que visitam o perfil dele também veem?          resposta:quero poder colocar pngs, mas sim, coloque coisas genericas no começo. comesticos na pagina de perfil tambem, tanto no mobile quanto no web.  sim, ele precisa do jogo na bibliteoca pra personalizar. uam recompensa,pode ser,se ele tiver o jogo na bibliteoca, ter um post no forum com mais de 10 likes, uma review com mais de 100, ter mais de 100 horas naquele jogo, ou seja, inumeros jeitos de ganhar custmizaçao. quero um jeito de poder adicionar. adicione no minimo 10 jeitos de ganhar uma costumizaçao de um jogo, outro é ganhar todas as conquistas desse jogo em especifico. a customizacao todos vem, se nao nao tem sentido. mas tambem os amigos podem ter a opcao de ver a pagina de jogo sem nenhuma customizaçao no parte lateral esquerda no começo apenas. botao de ver costumizaçao ou pagina de jogo normal. faça parte 1 e 3 e depois a 2 em outra tacada. o spoiler que esat vinculado a uma conquista, a pessoa pode ver ,mesmo se nao tiver tal conquista. apenas tem uma tela de enfatizaçao maior que apenas a de spoiler sem nenhuma conquista, mas se a pessoa ja tiver tal conquista,nem aparece esse de spoiler de conquista,so aparece o nome da conquista likado a tal post. 