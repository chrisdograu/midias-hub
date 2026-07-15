# Plano de correção — MIDIAS

## ✅ Rodada 5/6/7 (itens 58–70)

### Banco (migração `20260715_...`)
- **#62** `notification_type` ganhou valor `lembrete_torneio` — `tournament-reminders` agora usa o tipo certo.
- **#69** `biblioteca_usuario.status` recebeu `CHECK` restrito a `ja_joguei, zerado, jogando, pausado, abandonado, quero_jogar, platinado`.

### Edge Functions
- **#58** `seed-admin-friends` e `seed-test-users`: senha por conta agora é `crypto.randomUUID()`. Devolve credenciais só para as contas **criadas nesta execução** (campo `new_credentials`) — chamadas subsequentes não repetem a senha, e nada é logado.
- **#59** Todas as 4 Edge Functions: CORS agora vem de allowlist (`midias-midas.lovable.app`, preview, localhost dev). Fim do `Allow-Origin: *`.
- **#60** Ação `create_batch` removida de `manage-employee` — seed em massa é responsabilidade das funções `seed-*` dedicadas.
- **#61** `tournament-reminders` exige header `x-cron-secret` igual a `TOURNAMENT_CRON_SECRET` (se a variável estiver setada). Sem o segredo, 403.
- **#65** `seed-test-users`: `listUsers()` saiu do loop, agora executa 1x igual `seed-admin-friends`.

### Frontend
- **Rodada 6 / crítico**: `Checkout` agora chama `redeemCupom(pedido.id)` depois de `criarPedido` — sucesso só é declarado se o resgate atômico (RPC `validate_and_use_coupon`) passar. Se o cupom esgotar entre o clique e a confirmação, o pedido é marcado `cancelled` e o usuário vê erro. Item 5 (rodada 1) volta a ficar honestamente ✅.
- **Rodada 6 / duplo clique**: `Checkout` migrou de `useState(processing)` para `useSubmitGuard` (mesma trava `useRef` já usada em 4 outros pontos).
- **#66** `userOwnsGame` em `useCosmetics` agora filtra por `status IN (ja_joguei, zerado, jogando, pausado, abandonado, platinado)` — `quero_jogar` deixou de liberar customização cosmética. Constante `OWNERSHIP_STATUSES` exportada para virar fonte única de verdade.
- **#67** `ProtectedRoute`: `DEV_BYPASS` agora é `false && import.meta.env.DEV` — no build de produção o Vite elimina o ramo por completo, então nem um commit acidental de `true` liga o bypass em prod.
- **#63** `profile-privacy.test.ts`: comentário sobre "amigo mútuo" corrigido — a definição é `conversas.status = 'accepted'` (o que `are_mutual_friends()` faz), não follow bidirecional.
- **#70** `useFavoritoAnuncio.toggle` agora checa `error` também no ramo de **remover**, revertendo o toast e o estado visual se o `delete` falhar.

## ⏳ Não fiz nesta rodada — decisão consciente
- **#64** É a raiz do #25, já corrigido no servidor (`create_order_secure`); nenhuma ação nova aqui.
- **#68** Nota descritiva sobre `canAccess` — sem ação de código.

## ✅ Rodada 4 (auditoria itens 38–57)

### Banco (migração `20260714_...`)
- **#40** `is_user_banned()` agora barra INSERT em `avaliacoes` e `pedidos` — usuário suspenso não avalia nem finaliza compra.
- **#46** Bloqueio bidirecional: policies de INSERT de `mensagens` (direta, com `receiver_id`) e `follow_requests` rejeitam quando o alvo bloqueou o remetente (`blocked_users`).
- **#53** `admin_grant` entrou na whitelist do índice único diário de `user_xp_log` — múltiplas concessões manuais por dia agora somam sem perda silenciosa.
- **#52** Nova RPC `read_user_library_admin(_target, _reason)` (`SECURITY DEFINER`): valida `is_admin()`, exige justificativa ≥6 chars, escreve `admin_logs` no servidor e só então retorna `biblioteca_usuario` — chamar direto a tabela não é mais uma bypass.
- **#38** Já resolvido na rodada anterior (`create_order_secure` decrementa estoque com lock).

### Frontend
- **#39** `Produtos.tsx`: `original_price` agora é campo próprio (`fOriginalPrice`). Editar produto sem tocar no preço original preserva o desconto. Também expõe toggle "Destacar" gravando `featured`.
- **#42** `BundlesAdmin` e `AvaliacoesUsuario`: substituído `prompt()`/click-direto por `AlertDialog` (com campo de justificativa no bundle, no padrão de `Categorias.tsx`/`Produtos.tsx`).
- **#44** `LogsAdministrativos`: paginação por cursor (`created_at` decrescente, `range(0, 499)` + "Carregar mais 500 anteriores"). Fim explícito ao esgotar.
- **#45** `NotificacoesEspeciais`: fluxo agora é "Ver quantos vão receber" → `AlertDialog` mostra a contagem real da audiência ANTES do envio, e explicita que broadcast especial ignora preferências.
- **#48 / #49** `TitulosAdmin`: `sanitizePgrst()` remove `,()\*` antes do `.or()` (fecha bypass do parser); dedupe (`user_id`+`name`) antes de conceder; `AlertDialog` substitui o `prompt()` de motivo.
- **#50** Campo "Destaque" adicionado em `CriarJogo` e `Produtos`. `SugestoesJogos` insere com `featured:false` explicitamente (produto novo não vira destaque acidental).
- **#51** `CriarTorneio`: valida `ends_at > starts_at`, `max_participants ≥ 2`, e potência de 2 quando o formato é `single_elimination`.
- **#52** UI: `BibliotecaSocialAdmin` agora chama a RPC (não a tabela direta), então honestidade ≠ auditoria mais.
- **#43** `IntegracoesAdmin`: banner amarelo "Em construção — disparo automático ainda não implementado" acima da tabela, para não sugerir capacidade que não existe.
- **#47** `Moderacao.tsx`: `TARGET_CONFIG` recebe alias `comentario_forum` → `forum_replies`, então denúncias do mobile passam a aparecer/resolver.
- **#54** `ReviewCompletaEditor`: autosave por `(user_id, product_id)` em `localStorage` (debounced 800ms), restauro ao reabrir, limpeza após salvar no servidor.
- **#56** `Contato`: honeypot invisível (campo `website` fora da tela) descarta submissões automáticas silenciosamente.

## ⏳ Não fiz — decisão consciente

- **#41** Cargo/posição de funcionário: guarda de rota real + policies RLS por `position` é retrabalho grande; time é pequeno hoje. Registrado como limitação conhecida no `.lovable/memory` (todos os `role='atendente'` compartilham acesso de banco).
- **#43** disparo automático de webhooks: só sinalizado como "em construção" — precisa de edge function dedicada.
- **#55** Evidência em reporte de partida: `TournamentMatch.tsx` não tem hoje formulário direto de reporte pra ser instrumentado. Fica pra quando o fluxo de reporte for reintroduzido.
- **#57** `TermosDeUso` já tem data de "Última atualização" — sem ação.
- **#24** Warnings do linter Supabase (agora ~209): mesma decisão da rodada 3.



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
