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

### Item 3/3b — Em Alta unificado ✅
Decisão confirmada: **fórmula ponderada geral** (mesma do Radar da Home). Subtítulo de `EmAlta.tsx` agora deixa isso explícito. Não é espelho do radar pessoal — é o pulso da comunidade toda.

### Item 17 — Integração Steam (parcial/AFK)
Botão "Conectar Steam" adicionado em `PreferencesPanel` **desabilitado com badge "em breve"** — sinaliza a intenção sem implementar backend. Volta como sprint dedicado quando `STEAM_API_KEY` estiver disponível.

### Item 18 — Onboarding ✅
- Nova coluna `profiles.onboarded_at` marca conclusão/skip.
- `OnboardingDialog` aparece 1x no `Index` para logado com `onboarded_at` nulo. Escolhe até 3 gêneros dentre `categorias` existentes. **Pulável** — o skip também grava `onboarded_at` pra não repetir.
- Editável depois em `/perfil` → seção "Preferências" (`PreferencesPanel`).

### Item 19 — Programa de indicação ✅ (via XP)
- Novas colunas em `profiles`: `referral_code` (gerado por trigger `profiles_set_referral_code`) e `referred_by` (uma vez só).
- RPC `redeem_referral(_code)` valida código, prende `referred_by`, e insere `user_xp_log`: +200 XP pra quem indicou, +100 pra quem entrou.
- UI em `PreferencesPanel`: mostra código do usuário + botão copiar + campo pra resgatar código de amigo.

## ⏳ Não fiz nesta rodada — mostrando por quê antes de mexer

### Item 10 — Regenerar `types.ts`
Não regenerei manualmente. **Motivo:** o `types.ts` é regenerado automaticamente pela plataforma após cada migração aprovada.


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
