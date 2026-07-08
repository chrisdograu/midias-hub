# Plano de correção — Camada 2

Priorizado por **severidade real** (dado sensível > integridade > UX). Cada bloco pode virar 1 PR.

## Sprint 0 — Segurança crítica (fazer HOJE)

### 0.1 Fechar vazamento de `profiles` (achado 2.1)

- Migration: `DROP POLICY "Anyone can view profiles publicly" ON public.profiles;`
- Criar view `public.public_profiles` só com `id, display_name, avatar_url, banner_url, bio, created_at` (nunca `cpf/phone/contact_email/birth_date`).
- `GRANT SELECT ON public.public_profiles TO anon, authenticated;`
- Recriar policy de SELECT em `profiles`: dono OR admin OR (amigo mútuo E `is_private=false`) — nunca `public`.
- Refatorar `PublicProfile.tsx`, `SellerProfile.tsx`, `FriendProfile.tsx`, `MProfile.tsx` para consultar `public_profiles` no lugar de `profiles` quando não for o próprio usuário.
- Auditar `grep -rn "from('profiles')" src/` — cada ponto precisa decidir: dono? admin? público? escolher a fonte correta.

### 0.2 Fechar acesso admin a mensagens privadas

- `MensagensAdmin`: exigir `denuncia_id` presente + banner de justificativa antes do fetch.
- Trigger `admin_logs` imutável ao acessar `mensagens` via admin (append-only, sem UPDATE/DELETE em policies).

## Sprint 1 — Integridade de dados e ranking

### 1.1 Dedupe de `product_views` (achados 2.3/2.4)

- Índice único parcial: `(product_id, user_id, date_trunc('hour', viewed_at))` — 1 view por usuário/hora.
- Para deslogados: usar `session_id` (uuid em `sessionStorage`), coluna `session_id text`.
- No `GameDetail.tsx`: envolver o insert em `onConflict: ignore`.

### 1.2 Unificar "Em Alta" com `useRadarDelta`

- Refatorar `EmAlta.tsx` para consumir `useRadarDelta` (mesma fórmula da Órbita).
- Criar RPC `radar_delta(window_hours int)` no banco para não puxar 3 tabelas separadas do client.

### 1.3 Cupom com lock server-side

- Migration: mover validação de `max_uses` para trigger `BEFORE INSERT` em `cupon_usos` com `SELECT ... FOR UPDATE` na linha do cupom.
- Rejeitar com `RAISE EXCEPTION` — client trata erro específico.

### 1.4 Review-bombing (Web GameDetail + MReview + MobileReview)

- Constraint `CHECK` + trigger em `avaliacoes`: exigir `EXISTS (biblioteca_usuario WHERE user_id = NEW.user_id AND produto_id = NEW.produto_id AND status IN ('owned','playing','finished'))`.

### 1.5 Ownership órfão em grupos

- Trigger `BEFORE DELETE` em `group_members`: se saindo for owner E há outros membros, promover `admin` mais antigo. Se for único, deletar o grupo.

## Sprint 2 — Higiene estrutural (multi-página)

### 2.1 Error boundary global do React Query (achado 2.5)

- Criar `<QueryErrorBoundary>` em `src/components/QueryErrorBoundary.tsx` com fallback + botão "tentar novamente".
- Envolver rotas em `App.tsx`.
- Criar hook `useQueryWithFeedback` que expõe `errorNode` pronto.
- Substituir nas 22 telas em uma pass.

### 2.2 Regenerar `types.ts` (achado 2.6)

- Rodar geração via CLI Supabase (`supabase gen types typescript`).
- Remover `as any` órfãos com codemod (`ts-morph` ou script `sed` guiado).
- Meta: <50 ocorrências (só onde tipo dinâmico é legítimo).

### 2.3 Destaques reais (achado 2.2)

- Decisão: **implementar** curadoria (não remover promessa).
- UI: toggle `featured` em `JogosAdmin.tsx` + coluna na lista.
- `Index.tsx`: `.filter(p => p.featured).slice(0,3)` com fallback para os 3 mais recentes se vazio.

## Sprint 3 — Consolidação e dead code

### 3.1 Remover dead code

- `rm src/pages/ForumGeral.tsx src/pages/Social.tsx` (achado 2.8).
- Buscar imports órfãos.

### 3.2 Consolidar telas admin duplicadas (achado 2.12)

- Decidir merge: `JogosAdmin` ⊃ `Produtos` (produtos são a fonte); redirect da rota antiga.
- `Torneios` vira hub com abas para "Atuais" e "Eventos"; deletar as duas páginas separadas.
- `TicketsList` já é o compartilhado — remover `TicketsMobile`/`TicketsWeb` (são wrappers de 1 linha) ou manter só como rotas com `channel` param.

### 3.3 Paginação server-side compartilhada

- Criar RPC `catalog_page(filters jsonb, page int, per_page int)` retornando `{items, total, facets}`.
- Refatorar `useProdutos` para aceitar `{page, filters}` e mudar consumidores (`Home` continua pegando "featured/recent" curtos; `Catalogo`/`Ofertas`/`EmAlta` paginam).

## Sprint 4 — Endurecimento

- 2FA obrigatório para roles admin (`Funcionarios.tsx` + edge function bloqueia login sem OTP configurado).
- Invalidar sessão JWT ao trocar `position` (edge function `manage-employee` chama `auth.admin.signOut(user_id)`).
- Trigger de notificação respeita `notification_preferences` (mover check para dentro dos triggers de `notify_*`).
- Sanitizar `dangerouslySetInnerHTML` dos cosméticos: validar `ownerId` com regex UUID, `color` com regex hex antes de interpolar.
- Fingerprint de torneio + validação server-side de ordem de eventos de partida.

## Fora deste plano (registrar como próxima Camada 3)

- Auditoria de Edge Functions (auth, service-role usage, rate limit).
- Auditoria de Storage policies (uploads, tamanho, tipo).
- Auditoria de realtime channels (leaks, cost).
- Bundle size / code-splitting.

## Ordem sugerida de execução

```
Sprint 0 (hoje)  → Sprint 1 (semana 1) → Sprint 2 (semana 2)
                                       ↘ Sprint 3 (paralelo, low-risk)
Sprint 4 → depois que 0-2 estabilizarem
```

## Como quer prosseguir?

- **A)** Começo pelo Sprint 0 agora (migration de `profiles` + view pública).
- **B)** Faço Sprint 0 + 1 juntos.
- **C)** Prefere revisar o plano antes; ajusto prioridades.              faça B