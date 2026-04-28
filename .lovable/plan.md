
# Mobile MIDIAS — Refazer do zero, fluido e funcional

Vou apagar tudo que existe hoje em `/m/*` e reconstruir como um app mobile coeso, com a mesma identidade visual do Web/Desktop (Teal `#14B8A6` + Purple `#A855F7`, Orbitron/Inter, glassmorphism, dark default), prefixo de marca "M/" (não "r/") para o fórum, e 6 abas na bottom nav exatamente nesta ordem:

```text
[ Home ] [ Marketplace ] [ Fórum ] [ Chat ] [ Perfil ] [ Config ]
```

---

## 1. Arquitetura de rotas

Tudo isolado sob `/m/*` com layout próprio (`MobileLayout`) que contém header simples + outlet + bottom nav fixa. Detecção `useIsMobile()` no `/` redireciona automaticamente para `/m` quando viewport for mobile (mas qualquer um pode acessar `/m` direto).

```text
/m                          → Home (feed misto)
/m/marketplace              → Lista de anúncios (filtros, busca)
/m/marketplace/:id          → Detalhe do anúncio
/m/forum                    → Top 10 "M/jogos" + feed de posts/reviews com filtros
/m/forum/jogo/:id           → Página do jogo: 2 abas (Fórum | Reviews)
/m/forum/post/:id           → Post + comentários infinitos estilo Instagram
/m/review/:id               → Review individual com likes/dislikes/comentários
/m/chat                     → Lista de conversas
/m/chat/:conversaId         → Tela de chat (com contraoferta se aplicável)
/m/perfil                   → Meu perfil + ações (vender, certificar, etc.)
/m/perfil/:userId           → Perfil público de outro usuário
/m/config                   → Configurações completas (tema, notif, bloqueios, conta)
/m/anuncio/novo             → Criar anúncio (escolhe protegido vs sem certificado)
/m/auth                     → Login/cadastro mobile (paridade com web)
```

---

## 2. Identidade visual (não negociável)

- Reuso 100% dos tokens Tailwind já existentes (`bg-primary`, `text-price`, `gradient-text`, `glow-primary`).
- Cards com `backdrop-blur` + borda sutil neon, exatamente como GameCard.
- Bottom nav: glassmorphism com gradiente Teal→Purple no ícone ativo, badge numérico nos itens com pendências (Chat e Fórum quando houver menção).
- Animações Framer Motion: slide horizontal entre tabs, spring nos botões, fade nos modais.
- Logo "MIDIAS" no header com fonte Orbitron, mesmo gradiente.
- Marca de comunidade: `M/genshin`, `M/eldenring`, `M/csgo` (prefixo "M/" em vez de "r/"), com cor accent purple.

---

## 3. Bottom Nav — 6 itens, ordem definitiva

| # | Ícone | Rota | Badge |
|---|-------|------|-------|
| 1 | Home | `/m` | — |
| 2 | ShoppingBag | `/m/marketplace` | — |
| 3 | MessageSquare (M/) | `/m/forum` | menções |
| 4 | Send | `/m/chat` | mensagens não lidas |
| 5 | User | `/m/perfil` | — |
| 6 | Settings | `/m/config` | — |

Bottom nav fica fixa, com safe-area-inset-bottom para iOS.

---

## 4. Home (`/m`) — Feed misto inteligente

Stack vertical com 3 seções intercaladas em ordem de relevância:

1. **Hero compacto MIDIAS** (igual web mas reduzido): logo + tagline + CTA "Explorar Marketplace".
2. **Top 5 jogos populares** (cards horizontais scrolláveis, vindos de `produtos` ordenado por `rating`).
3. **Feed misto** (lista vertical infinita, cada card com badge de tipo):
   - Posts recentes do fórum (`forum_posts` com `likes_count` alto da última semana).
   - Reviews populares (`avaliacoes` com `review_likes` agregados).
   - Anúncios em destaque (`anuncios status=active`, recentes).
   - Filtro no topo: chips `Tudo | Fórum | Reviews | Marketplace`.

Cada card linka para sua tela própria. Pull-to-refresh.

---

## 5. Marketplace (`/m/marketplace` + `/m/marketplace/:id`)

**Lista** (estilo OLX/Facebook Marketplace):
- Busca no topo + filtros (categoria, plataforma, condição, faixa de preço, "aceita troca", "com certificado").
- Grid 2 colunas com foto, título, preço, badge de certificado/troca, nome do vendedor + estrelas.

**Detalhe do anúncio:**
- Carrossel de fotos (swipe horizontal, paginação com pontinhos) — usa `fotos_anuncio`.
- Título, preço grande, badges (protegido/sem certificado, novo/usado, aceita troca).
- Descrição expansível.
- **Card do vendedor:** avatar + display_name + rating médio (de `avaliacoes_usuario`) + botão "Ver perfil" (vai pra `/m/perfil/:userId`).
- Botão grande **"Mandar mensagem"** → cria/abre conversa em `conversas` e navega para `/m/chat/:id`.
- Se anúncio tem `desired_item` ou `ad_type='troca'`, botão extra **"Fazer contraoferta"** abre modal e cria mensagem especial no chat (ver §7).
- Seção "Itens parecidos" (mesma `category` ou `plataformas` overlap).
- Botão "Denunciar anúncio" (cria registro em `denuncias` com `target_type='anuncio'`).

---

## 6. Fórum (`/m/forum`) — Estilo Reddit, branding M/

**Página principal `/m/forum`:**
- Top: "**Top 10 M/jogos**" — chips horizontais scrolláveis com os jogos com mais posts/likes na semana. Clicar leva a `/m/forum/jogo/:id`.
- Tabs: `Posts populares | Reviews populares | Mais comentados | Recentes`.
- Filtro de período: `Hoje | Semana | Mês | Ano | Todos` (chips).
- Feed vertical de cards. Cada card de post mostra: M/jogo, autor, preview do conteúdo, contagem de likes/dislikes, contagem de comentários, **e se houver um comentário com mais likes/respostas que o post, esse comentário aparece destacado abaixo** (estilo Instagram "comentário em destaque").
- Botão "Ver mais M/" abre lista completa de jogos.
- Busca global no topo.

**Página do jogo `/m/forum/jogo/:id`:**
- Header: capa do jogo + título + nota média + contagem de membros (posts únicos).
- **Duas abas grandes:** `Fórum (M/jogo)` | `Reviews`.
  - **Fórum:** lista de posts daquele jogo, botão "Criar post" flutuante.
  - **Reviews:** lista estilo Letterboxd — avatar do autor, nota em estrelas (HalfStarRating já existe), texto curto, likes/dislikes, comentários. Filtros: popularidade / recentes / mais curtidos. Botão "Escrever review".

**Post `/m/forum/post/:id`:**
- Conteúdo do post + autor + likes/dislikes + ações (responder, denunciar, salvar).
- Lista de comentários (`forum_replies`), com **respostas infinitas estilo Instagram**: cada resposta a uma resposta mostra apenas `@nomeDaPessoa` no início (não indenta infinitamente). Botão "Ver mais respostas (3)" expande inline.
- Ordenação: `Mais curtidos | Recentes | Mais respondidos`.
- Comentário com mais likes/respostas que o post fica fixado em destaque no topo dos comentários.

**Cálculo de popularidade (lado cliente, agregação simples):**
```text
score = likes - dislikes + (replies_count * 2)
```
Posts cujo melhor comentário tem `score_comentario > score_post` são promovidos para a aba "Populares" mesmo se o post em si for fraco.

---

## 7. Chat (`/m/chat`) — Lista + thread + contraofertas

**Lista `/m/chat`:**
- Cards de conversa: avatar do outro participante, nome, prévia da última mensagem, timestamp, badge de não lidas, indicador se conversa está vinculada a um anúncio.
- Busca por nome.
- Botão flutuante "Nova conversa" abre seletor de usuários (apenas quem aceitou pedido de chat — ver §abaixo).

**Thread `/m/chat/:conversaId`:**
- Header com avatar + nome do outro + botão "Ver perfil" (`/m/perfil/:userId`).
- Bolhas estilo WhatsApp (própria à direita teal, alheia à esquerda neutra).
- Input com:
  - Botão de anexar imagem (upload pra bucket `ad-images` reutilizado, ou criar novo `chat-images` se preferir — eu crio com SQL).
  - Botão "Fazer contraoferta" **só aparece se a conversa está vinculada a um anúncio com `ad_type='troca'` ou que o vendedor habilitou** (verifica `anuncios.desired_item IS NOT NULL`).
- **Caixa de contraoferta:** mensagem renderizada como card especial (borda purple + ícone de troca) com:
  - Tipo: "Dinheiro: R$ X" ou "Item: descrição".
  - Botões "Aceitar" / "Recusar" / "Contra-contraoferta" para o destinatário.
  - Aceitar cria registro em `trade_proposals` com `proposer_confirmed=true`, aguardando o outro lado.
- Convites de chat fora-de-anúncio (pessoa do fórum manda msg pra outra): primeira mensagem vira um "pedido de conversa" — destinatário precisa aceitar antes de virar chat normal. Implemento isso com uma coluna nova `conversas.status` (`pending`/`accepted`/`rejected`) via migração.

**Migrações DB necessárias:**
- `ALTER TABLE conversas ADD COLUMN status text DEFAULT 'accepted'` (default accepted pra não quebrar conversas existentes vindas de anúncio).
- `ALTER TABLE mensagens ADD COLUMN message_type text DEFAULT 'text'` + coluna `payload jsonb` para mensagens de contraoferta (`{type:'money', amount:50}` ou `{type:'item', desc:'...'}`).
- `ALTER TABLE anuncios ADD COLUMN accepts_counteroffer boolean DEFAULT false` para o vendedor habilitar.
- Bucket novo `chat-images` (público read, auth-only write).

Realtime: assino `mensagens` e `conversas` por usuário pra atualizar lista e thread em tempo real.

---

## 8. Perfil (`/m/perfil` e `/m/perfil/:userId`)

**Meu perfil (`/m/perfil`):**
- Header: avatar grande, display_name, @username, bio, rating médio recebido, contagem de anúncios ativos.
- Cards de ação: "Meus anúncios", "Minhas reviews", "Meus posts no fórum", "Minha biblioteca", "Meus pedidos", "Solicitar certificado de vendedor protegido".
- Botão "Editar perfil".

**Perfil público (`/m/perfil/:userId`):**
- Mesma estrutura sem ações privadas.
- Botão **"Mandar mensagem"** (cria conversa pending) e **"Bloquear"** e **"Denunciar usuário"**.
- Lista de anúncios ativos do usuário, reviews escritas, reputação.

---

## 9. Configurações (`/m/config`) — Funcionando de verdade

- **Conta:** alterar display_name, username, bio, avatar (upload), email de contato, telefone, CPF.
- **Vendedor protegido:** botão "Solicitar certificação" — abre formulário pedindo dados sensíveis (CPF, telefone, endereço); cria registro em `certificados` com `status='pendente'` para moderadores aprovarem no Desktop. Texto explicativo claro: "Anúncios protegidos pela loja exigem verificação. Sem certificação, você ainda pode anunciar mas a loja não responde por reembolsos."
- **Notificações:** toggles `push_notifications` e `email_notifications` (já existem em `profiles`).
- **Tema:** Light/Dark (já existe `useTheme`).
- **Privacidade:** toggle `is_private` (oculta biblioteca).
- **Usuários bloqueados:** lista de `blocked_users` com botão desbloquear (componente `BlockedUsersTab` já existe — reuso).
- **Sair da conta**.

---

## 10. Criar anúncio (`/m/anuncio/novo`)

Form passo-a-passo:
1. Tipo: Venda | Troca | Ambos.
2. **Escolha de proteção** (com explicação clara):
   - "Protegido pela loja" — exige certificado aprovado (se não tiver, redireciona pra solicitar).
   - "Sem certificação" — disclaimer: "Loja não responde por reembolsos. Negocie por sua conta e risco."
3. Categoria, plataformas (multi), condição.
4. Título, descrição, preço (ou "item desejado" se troca).
5. Toggle "Aceito contraofertas".
6. Upload de fotos (até 6, bucket `ad-images`).
7. Publicar → insere em `anuncios` + `fotos_anuncio`.

---

## 11. Sistema de denúncias e moderação (integração com Desktop existente)

Cada tela de conteúdo (post, review, comentário, anúncio, perfil, mensagem) tem botão "Denunciar" que abre modal com motivos pré-definidos e descrição opcional, criando registro em `denuncias` com `target_type` apropriado. Os moderadores no Desktop (já implementado em `/desktop/moderacao`) revisam e podem aplicar `banned_until` no perfil — bloqueio já é feito pelas RLS existentes (`is_user_banned`).

---

## 12. Plano de implementação (ordem de entrega)

Vou implementar em **uma única rodada** porque tudo é interdependente, mas seguindo esta ordem:

1. **Migrações SQL** (conversas.status, mensagens.message_type+payload, anuncios.accepts_counteroffer, bucket chat-images + RLS).
2. **MobileLayout + BottomNav + redirect mobile no `/`**.
3. **Auth mobile** (paridade visual já existente).
4. **Home (`/m`)** com feed misto.
5. **Marketplace** (lista + detalhe + denúncia).
6. **Chat** (lista + thread + contraoferta + realtime + upload imagem).
7. **Fórum** (home + página de jogo com 2 abas + post com Instagram-style replies).
8. **Reviews estilo Letterboxd** (lista + criação + likes/dislikes/comentários).
9. **Perfil próprio + público + ações de bloquear/denunciar**.
10. **Configurações completas + solicitação de certificado**.
11. **Criar anúncio**.
12. **Atualizar memórias** (`mem://style/layout-mobile`, criar `mem://features/mobile-app-completo`).

---

## 13. Detalhes técnicos

- **Stack:** mesmo React/Vite/TS/Tailwind/shadcn/Framer Motion/Supabase. Zero novas dependências.
- **Sem PWA / sem service worker** (regra do ambiente). Mobile é responsivo + instalável só via manifest simples (já existe ou eu adiciono `manifest.json` mínimo, sem `vite-plugin-pwa`).
- **Realtime:** uso `supabase.channel` em `mensagens`, `conversas`, `forum_posts`, `forum_replies`, `notifications` com cleanup correto no unmount.
- **Performance:** virtualização não é necessária no escopo do TCC; uso paginação simples (`limit 20` + "carregar mais").
- **RLS:** todas as tabelas já têm policies adequadas; só preciso garantir que as novas colunas (`message_type`, `payload`, `accepts_counteroffer`, `conversas.status`) são acessíveis pelas policies existentes (são, porque são `ALL`/`SELECT` por participante).
- **Validação:** zod em todos os forms (auth, anúncio, post, review, comentário, contraoferta) com limites de caracteres.
- **PT-BR:** 100% em toda a UI e mensagens.

---

## 14. O que NÃO vai mudar

- Web (catálogo/checkout/biblioteca) continua intocado.
- Desktop backoffice continua intocado (apenas se beneficia das novas denúncias).
- Banco continua compartilhado entre as 3 plataformas.

---

**Posso começar?** Após sua aprovação, executo tudo de uma vez. Estimativa: 1 rodada longa de implementação, build verificado no final.
