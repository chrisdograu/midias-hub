# Plano Final — Revisão MIDIAS (aprovado)

## Decisões do usuário
- **Amigos favoritos**: gerenciados apenas pelo próprio usuário, configuráveis somente em `/perfil` (Web).
- **Busca Global Única**: indexa Mobile + Web, mostra ambos com tag `📱 Mobile` / `🖥 Web`. Ao clicar, abre direto se a plataforma atual tiver o destino; senão mostra "Abrir versão Web/Mobile".
- **Opiniões → conversa privada**:
  - Cada resposta inicia conversa vinculada permanente à opinião.
  - Opinião original sempre fica fixa no topo da conversa.
  - Acesso via Web em área dedicada "Conversas de Opiniões".
  - Rota canônica: `/perfil/:userId/jogo/:productId/opniao/:opinionId/conversa/:convId`.
  - Nunca misturar com DM normal nem virar comentário público.
- **Wrapped Gamer / Cápsula do Tempo / Primeiros Marcos**: adiados (não nesta fase).

## Rodada A1 — Pendências técnicas do topo do `ras.txt`
1. Notificação quando vaga da fila do torneio é liberada (trigger em `tournament_waitlist`).
2. Insígnias PLAT / ✓ 100% e badges de status consistentes em Biblioteca, FriendProfile, SocialLibrary e mobile (componente único).
3. Página `/jogo/:productId/review-completa` (formulário, save em `reviews_completas`, exibir card na BibliotecaJogo).
4. Busca, filtros e paginação na seção Comunidade do MForum.
5. Export CSV das Estatísticas do torneio (ranking + timeline).
6. Filtros/ordenação na aba Estatísticas (busca por participante, período, vitórias, partidas).

## Rodada A2 — Identidade Mobile vs Web
- Auditar nav/headers e remover sobreposições.
- Mobile = Fórum, Reviews, Marketplace, Chat, Torneios, Descoberta.
- Web = Biblioteca Social, Perfil Gamer, Páginas de Jogo do Usuário, Loja, Histórico.
- Remover comportamento de feed viral de `Social.tsx`/`SocialLibrary.tsx`.

## Rodada A3 — Biblioteca Social como "casa pessoal"
- Tirar trending/scroll infinito.
- Modos de exploração: por amigo, jogo, ano, tipo, favorito.
- Sugestões = reviews de amigo não vistas, jogos em comum, memórias antigas.
- Copy/empty states com metáfora de biblioteca.

## Rodada A4 — Amizades = Follow Mútuo + Amigos Favoritos
- View `v_friendships` (mutual follows) reusada por todas as consultas de amigos.
- Tabela `friend_favorites (user_id, friend_id)` — gerida só em `/perfil` Web.
- Gate de acesso (Biblioteca Social, FriendProfile, BibliotecaJogo) por mutualidade.

## Rodada A5 — Perfil Gamer (memória)
- Linha do Tempo Gamer (agrupada por ano) usando `game_timeline_events`.
- Destaques do usuário: tabela `profile_highlights (user_id, type, ref_id, order)` — jogos, reviews, screenshots, opiniões.
- Wrapped / Cápsula / Marcos → adiados.

## Rodada A6 — Página do Jogo do Usuário + Opiniões + Páginas de Jogo separadas
- Reforçar `BibliotecaJogo` como "identidade do jogo dentro da pessoa".
- Refatorar `OpinionsPanel`:
  - Resposta cria conversa privada permanente vinculada à opinião.
  - Tabela `opinion_conversations (id, opinion_id, author_id, responder_id, created_at)` agrupando mensagens.
  - Mensagens em `game_opinion_replies` já existem — ligar via `conversation_id`.
  - Externos só veem contador "X pessoas responderam".
  - Rota canônica `/perfil/:userId/jogo/:productId/opniao/:opinionId/conversa/:convId`.
  - Página dedicada `/conversas-opinioes` listando todas as conversas do usuário.
- Garantir múltiplas páginas por jogo sem fundir (Loja, Fórum, Reviews, Biblioteca do Usuário, Hub Social).

## Rodada A7 — Busca Global + @user vs $seller + Privacidade + Marketplace + Tutoriais
- Rota `/busca?q=` com abas: Tudo | Jogos | Usuários | Vendedores | Reviews | Fórum | Marketplace.
- RPC `global_search(q)` indexando Mobile + Web.
- Cada resultado marcado com `📱 Mobile` / `🖥 Web` (pode ter ambos).
- Click inteligente: abre na plataforma atual se disponível; senão CTA "Abrir versão X".
- `@user` vs `$seller` com cor/ícone distintos.
- Privacidade centralizada em `/perfil/privacidade`.
- Marketplace: histórico, avaliações, indicadores objetivos (sem ranking agressivo).
- Tutoriais em `/config/tutoriais` + hook de primeiro uso `useFirstUseTutorial`.

## Ordem de execução
A1+A2 → A3+A4 → A5+A6 → A7. Backend (migrations) primeiro a cada par.
