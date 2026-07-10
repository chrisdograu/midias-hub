# Plano de correção — MIDIAS

## ✅ Nesta rodada

### Item 2 — Admin só vê mensagem privada sob denúncia
- `MensagensAdmin` agora carrega mapa de denúncias ativas (`target_type='conversa'`) e só abre o thread se houver `denuncia_id` associado.
- Antes do conteúdo, banner obrigatório com número da denúncia, status e motivo.
- Todo acesso registra em `admin_logs` via `adminLog({ action: 'admin_view_conversation', ... })`.
- Migração removeu a policy "Apenas admin geral reverte" → `admin_logs` agora é imutável (sem UPDATE/DELETE).
- Filtro padrão da lista mudou de "Todas" para "Apenas denunciadas".

### Item 6 — Avaliação exige posse do jogo
- Trigger `enforce_review_ownership` em `avaliacoes` (BEFORE INSERT/UPDATE): bloqueia com `RAISE EXCEPTION` se não existir linha em `biblioteca_usuario` com `status ∈ {ja_joguei, zerado, jogando, pausado, abandonado}`. `quero_jogar` explicitamente NÃO conta. Admins ficam isentos.

### Item 14 — SEO dinâmico
- `useDocumentMeta` aplicado em `GameDetail`, `SellerProfile`, `TournamentEvent` (title/description/OG/Twitter). PublicProfile já tinha.

### Item 15 — Sanitização do embed de live
- `buildEmbed` em `TournamentLivePanel`: whitelist de host (`endsWith`), regex por plataforma (`TWITCH_CHANNEL_RE`, `YOUTUBE_ID_RE`, `KICK_CHANNEL_RE`), `encodeURIComponent`, rejeita URLs com protocolo diferente de http/https.

### Item 16 — Sanitização dos cosméticos
- `ProfileCosmeticOverlay` e `GamePageCosmeticOverlay` agora validam `accent.payload.color`/`theme.payload.color` com `^#[0-9a-fA-F]{6}$` e `ownerId`/`productId` com regex de UUID antes de interpolar no `<style dangerouslySetInnerHTML>`.

### Item 20 — "Amigos que têm esse jogo"
- Novo componente `FriendsWithGame` cruzando `user_follows` × `biblioteca_usuario`. Card com avatar, nome, status e botão "Chamar" (link `/chat/:userId`). Inserido em `GameDetail` abaixo dos screenshots.

### Item 21 — Filtros por página
- **Catálogo**: plataforma virou multi-seleção (chips) usando o array `platform`; adicionado slider de faixa de preço (min/max); contador de filtros ativos + botão "Limpar"; ordenação "Relevância" removida em favor de "Mais recentes" (padrão honesto).
- **Ofertas**: adicionado slider "Desconto mínimo" (0–90%, step 5%).
- **Busca Global**: decisão registrada — não adicionar filtros (evita duplicar Catálogo; problema de perf conhecido fica para outro sprint).

### Item 8 (polimento) — Cabeçalho JogosAdmin
- Subtítulo agora deixa explícito: "atributos específicos de jogos · Produtos permanece a fonte única de catálogo/estoque".

### Item 11 — PWA
- `public/manifest.json` criado com ícones/tema/descrição.
- `public/service-worker.js` reescrito: precache de app shell, network-first p/ navegações, stale-while-revalidate p/ estáticos same-origin, não cacheia chamadas externas (Supabase).
- `<link rel="manifest" href="/manifest.json">` adicionado em `index.html`.

### Item 12 — CI básico
- `.github/workflows/ci.yml`: `npm ci`, `lint --if-present`, `test --if-present -- --run`, `build`. Não publica nada.

### Item 13 — Nomenclatura Flutter → Capacitor
- `.lovable/memory/*`, `docs/auditoria/*` reescritos (mantidas referências históricas em ADRs).

## ⏳ Não fiz nesta rodada — mostrando por quê antes de mexer

### Item 3/3b — Radar pessoal × Em Alta unificado
Não mexi. **Motivo:** a auditoria pede uma confirmação explícita de escopo antes de qualquer refactor:
- Em Alta unificado hoje está como (a) fórmula ponderada geral **ou** (b) espelho do Radar pessoal?
Só marcar como resolvido depois dessa confirmação — mexer sem essa resposta pode desfazer a separação que acabou de ser decidida entre as duas seções.

### Item 10 — Regenerar `types.ts`
Não regenerei manualmente. **Motivo:** o `types.ts` é regenerado automaticamente pela plataforma após cada migração aprovada. A migração desta rodada (trigger de posse + admin_logs imutável) já dispara essa regeneração — não faz sentido rodar `supabase gen types` num script paralelo que seria sobrescrito.

### Item 17 — Integração Steam
Não fiz. **Motivo:** exige (i) `STEAM_API_KEY` como secret de servidor (não solicitado até agora), (ii) edge function nova com biblioteca OpenID auditada, (iii) coluna `steam_id` em `profiles` mais UI de vinculação. É trabalho de sprint próprio — precisaria pelo menos da chave da API pra prosseguir. Sinalizo aqui em vez de "começar pela metade".

### Item 18 — Onboarding (gêneros/plataformas)
Não fiz. **Motivo:** decisões pendentes de produto: quantos gêneros escolher (3? 5?), lista canônica de gêneros (usar as `categorias` existentes ou introduzir taxonomia nova?), obrigatório ou pulável, quando dispara (pós-cadastro? primeira home?). Vale casar com o item 17 (mesma tela oferece "conectar Steam") como está sugerido no próprio prompt.

### Item 19 — Programa de indicação
Não fiz. **Motivo:** depende de decisão binária ("XP" vs "crédito/carteira"). Não existe sistema de carteira/wallet no schema hoje — implementar em XP é rápido, mas quero confirmar antes de criar coluna `referral_code` + tabela `referrals` + trigger de bônus.

### Item 22 — Verificação de vendedor
Decisão registrada de não mexer (CPF+telefone+atestado da plataforma bastam). Sem ação.

### Item 23 — Resumo semanal
Decisão registrada de não fazer. Sem ação.

### Item 24 — 198 warnings do linter Supabase
Aparecem depois de cada migração (agora 200). Fica para uma rodada dedicada — a maior parte são `search_path` mutável em SECURITY DEFINER e `EXECUTE` público em funções que poderiam ser INVOKER.

### Fora de escopo (decisão consciente já registrada)
- 2FA obrigatório para admin.
- Fornecedor externo de chaves.
- Testes E2E dos 5 fluxos críticos (depende dos itens 2/3/6/etc. estarem verdes primeiro — só sobrou item 3 em aberto).
