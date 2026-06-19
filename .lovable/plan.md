# Avaliação honesta antes do plano

Concordo com a maior parte da filosofia (bem-estar digital, explicabilidade, silêncio gracioso, antispoiler, identidade gamificada) — encaixa perfeitamente com o que o MIDIAS já é. Mas há pontos que **discordo** e quero ajustar antes de começar:

1. **"Apenas 2 entidades de primeira classe (games + profiles)"** — irrealista para o estado atual. Já temos `produtos`, `profiles`, `seller_profiles`, `anuncios`, `tournaments`, `biblioteca_usuario`, `reviews_completas` etc. Vou **mapear** sua ontologia para o que já existe (games ≈ `produtos`, profiles ≈ `profiles`) em vez de migrar/duplicar tabelas. Reescrever schema quebraria 90% do app.
2. **"Sem carrinho/checkout"** — você mesmo já tem um checkout simulado (Pix/CC, requisito do TCC). Vou **manter** o existente e apenas adicionar a "Loja = Opportunity Center" como uma **camada paralela** (scanner de oportunidades) na Home, sem remover nada.
3. **"Redirect para Steam/Epic/Nuuvem"** — fora do escopo TCC (100% online interno). Vou implementar as 4 prateleiras **dentro do catálogo MIDIAS**, com o mesmo conceito (drops, velocidade, órbita, fora da bolha), o que cumpre a intenção sem links externos quebráveis.
4. **`delta_score`/`gravity_score`** — não precisa coluna nova. Calculo **on-the-fly** com `useQuery` agregando `product_views`, `forum_posts.created_at`, `avaliacoes.created_at` das últimas 24h/72h. Performático e zero migração.
5. **Energia do card (dot sólido → oco ao clicar)** — uso `localStorage` por usuário, não tabela. Stateful no cliente, evita escrita ruidosa no banco.

Tudo o mais (antispoiler, diário com toque humano, locks cosméticos, chat second-screen, marketplace quick-glance, skeletons, prefetch, neon polish) está dentro do escopo e faz total sentido.

---

# Plano

## Fase 1 — Radar de Órbita + Energia (Home Web + Mobile)

**Componente novo:** `src/components/radar/OrbitRadar.tsx`
- `useQuery(['radar-delta'])` que faz **3 queries paralelas** das últimas 72h em `product_views`, `forum_posts`, `avaliacoes` agrupadas por `product_id`.
- Score = `count_24h * 3 + count_72h * 1`. Top 4 produtos.
- Renderiza carrossel horizontal fixo, **nunca muda ordem** após primeiro render (estabilidade visual).
- Cada card: thumb + título + **evidência explicável** ("12 views + 3 reviews nas últimas 24h"), dot de energia (sólido → oco via `localStorage` `radar-seen-{userId}`).
- Estado vazio: `🛰️ Você está em dia. Última varredura: HH:mm`.
- Inserido no topo de `src/pages/Index.tsx` e `src/mobile/pages/MHome.tsx`.

## Fase 2 — Opportunity Center (4 prateleiras dinâmicas)

**Componente novo:** `src/components/opportunity/OpportunityCenter.tsx` com 4 sub-prateleiras:
1. `💰 Grandes Oportunidades` — `produtos` ordenado por `discount DESC`, limit 8.
2. `🚀 Em Movimento` — reusa o cálculo de delta da Fase 1 (cache compartilhado via mesma queryKey).
3. `🎯 Próximos da Sua Órbita` — `favoritos` do user + `biblioteca_usuario` de amigos (`conversas` status=accepted) cruzando `category`/`tags`.
4. `✨ Fora da Sua Bolha` — `produtos` com `rating >= 4.25` (≈85%) de categorias **fora** do histórico do user.

- **Ordem dinâmica** das 4 linhas: pesa quantidade de itens em cada → linha com mais "calor" no topo.
- Cada prateleira mostra evidência ("Drop de 35% hoje", "3 amigos jogando").
- Linhas vazias **ocultas** (graceful silence).
- Plugado em nova rota `/oportunidades` + card destacado na Home substituindo a área "Loja" atual.

## Fase 3 — Antispoiler Filter

**Componente novo:** `src/components/spoiler/SpoilerGuard.tsx` (wrapper).
- Migração leve: `ALTER TABLE forum_posts ADD COLUMN is_spoiler boolean DEFAULT false, achievement_lock uuid REFERENCES user_achievements(id)`. Mesma coisa em `avaliacoes` + `reviews_completas`. **Com GRANTs** explícitos.
- Wrapper checa: se `is_spoiler` OU (`achievement_lock` && user não tem aquele achievement) → renderiza filho com `filter: blur(12px)` + overlay button "⚠️ Alerta de Spoiler — Clique para revelar".
- Aplicado em: `ForumGeral`, `MForumPost`, `MReview`, `GameDetail` reviews.
- Toggle no editor de post/review: checkbox "Conteúdo sensível / spoiler" + select opcional "Liberar para quem desbloqueou: [achievement]".

## Fase 4 — Diário de Bordo (toque humano)

**Componente novo:** `src/components/profile/PassiveTimelineHumanized.tsx`
- Reaproveita `GameTimeline` existente, agrupa eventos do dia em parágrafo automático ("Você jogou 6h de Celeste e desbloqueou 2 conquistas").
- Abaixo: ícone de lápis → input inline "Como foi esse dia? Deixe uma memória" → salva em **nova coluna** `game_timeline_events.user_note text` (migração + GRANT).
- Render: nota aparece em itálico ao lado do bloco automático, com badge "📝 memória pessoal".
- Plugado em `TimelineGamer.tsx` e `Perfil.tsx`.

## Fase 5 — Cosmetic Locks por achievement/playtime

- **Já temos** `user_titles` + `user_achievements` + `user_playtime`. Falta a **regra de unlock**.
- Migração: `ALTER TABLE user_titles ADD COLUMN unlock_rule jsonb` (ex: `{"type":"achievement","achievement_id":"..."}` ou `{"type":"playtime","product_id":"...","min_hours":20}`).
- Função SQL `public.can_equip_title(_user uuid, _title uuid) returns boolean` security definer.
- `ActiveTitleSelector` filtra opções: bloqueadas aparecem com 🔒 + tooltip explicando regra ("Complete Cyberpunk 2077 para desbloquear [Netrunner]").
- Reuso no chat (`MChatThread`, `MChat`) e reviews — títulos ativos já são exibidos via `LevelTitleBadge`, vou expandir para mostrar nos cabeçalhos de mensagem.

## Fase 6 — Skeletons + Prefetch

- Criar `src/components/skeletons/` com: `GameCardSkeleton`, `FeedItemSkeleton`, `RadarSkeleton`, `OpportunityRowSkeleton`, `TimelineSkeleton`, `ProfileSkeleton`.
- Substituir os `<Loader2 spin>` atuais em: `MHome`, `Index`, `Catalogo`, `Perfil`, `Biblioteca`, `MForum`, `Torneios`.
- **Prefetch de rotas** no `Header`/bottom-nav: ao `onMouseEnter` (web) ou `onTouchStart` (mobile) em links principais, disparar `queryClient.prefetchQuery` da query daquela página + `import()` do chunk lazy.
- Rotas alvo: `/catalogo`, `/biblioteca`, `/perfil`, `/m/forum`, `/m/marketplace`.

## Fase 7 — Neon Polish (contraste + acessibilidade light/dark)

- Auditar `--primary`/`--accent` no **modo light**: hoje teal 40% / purple 50% sobre `bg 93%` falha WCAG AA em texto pequeno. Subir saturação e baixar lightness do primary para 35%, accent para 45%.
- Reduzir intensidade do `glow-primary` no light mode (`opacity 0.15` em vez de `0.3`) — neon "queima" em fundo claro.
- Variáveis novas em `:root` e `.light`: `--neon-glow-intensity` e `--neon-border-opacity`, usadas nas utilities `.glow-primary`, `.neon-border-hover`, `.platform-pill`.
- Revisar `platform-ps/xbox/switch/pc`: cores fixas hex viram tokens semânticos com fallback por tema.
- Teste visual com Playwright capturando Home/Catálogo/Perfil em ambos os temas.

---

## Ordem sugerida & dependências

```text
Fase 1 (Radar) ──┐
                 ├─→ Fase 2 (Opportunity) usa o mesmo cache
Fase 3 (Spoiler) ┘   independente
Fase 4 (Diário) ─── independente, mas precisa de Fase 6 (skeleton)
Fase 5 (Locks) ──── independente
Fase 6 (Skeletons + Prefetch) ─── transversal, faço por último de UX
Fase 7 (Neon Polish) ─── transversal, faço por último (depois de Fase 6 existirem todos os componentes novos)
```

## Detalhes técnicos (resumo)
- **Sem novas tabelas grandes**: 3 migrations pequenas (`is_spoiler`+`achievement_lock`, `user_note`, `unlock_rule`) com GRANTs corretos.
- **Sem mexer no checkout** existente, sem mexer no Desktop/Backoffice.
- **Cache compartilhado** entre Radar e "Em Movimento" via mesma queryKey reduz queries.
- **localStorage** para estado de "card visto no radar" — não polui banco.

---

Por onde começo? Recomendo **Fase 1 + Fase 2 juntas** (compartilham cache e entregam o impacto visual mais alto na Home), depois Fase 7 para o polish neon, e o resto incremental. Confirma a ordem ou prefere outra?
