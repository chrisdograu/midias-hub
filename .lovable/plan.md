# Plano de correção — estado atual

Atualizado após o fechamento **real** do Sprint 0 (vazamento de `profiles`) e
introdução da RPC `get_public_profile` + `can_view_full_profile`.

---

## ✅ Concluído

### Sprint 0 — Segurança crítica
- **profiles**: policy `USING (true)` removida; `REVOKE SELECT` + `GRANT SELECT`
  em colunas seguras apenas. CPF, telefone, contact_email, prefs de notificação,
  `privacy_exceptions` e `require_follow_approval` só saem via `get_my_profile`
  (dono) ou `get_profile_admin` (admin).
- **RPC `get_public_profile(_uid)`** respeita `is_private` + amizade mútua +
  close friend + `privacy_exceptions`, expondo `can_see_full` para o cliente.
- **RPC `can_view_full_profile(owner, viewer)`** centraliza a regra.
- **PublicProfile.tsx** migrado para a RPC (era o último `select('*')`).
- **Testes** em `src/test/profile-privacy.test.ts` travam o contrato
  (12 casos, incl. follow assimétrico não libera).
- Acesso admin a mensagens: `admin_logs` append-only já aplicado em sprints anteriores.

### Sprint 1 — Integridade
- Dedupe `product_views` (índice único parcial + `session_id`).
- `validate_and_use_coupon` com `SELECT … FOR UPDATE`.
- `avaliacoes_require_ownership` trigger.
- `EmAlta` unificado no `useRadarDelta`.

### Sprint 2 — Higiene estrutural
- `QueryErrorBoundary` global em `App.tsx`.
- Curadoria real de destaques em `JogosAdmin` + `Index` com fallback.

### Sprint 3 — Limpeza
- Removidos `ForumGeral`, `Social`, `TicketsMobile`, `TicketsWeb`, `TorneiosAtuais`.
- Rotas desktop unificadas em `TicketsList` + `TorneiosAdmin`.

### Sprint 4 — Hardening
- `manage-employee` com `signOut` global ao mudar role/position.
- Trigger `audit_user_role_change` em `user_roles`.
- Trigger `enforce_match_event_order` em `tournament_match_events`.
- HIBP habilitado no auth.

---

## ⏳ Aberto — decisões de produto

Estes precisam de resposta do dono antes de virarem código:

1. **Owner real de grupo (achado 1.5)** — hoje o trigger `group_members_prevent_orphan`
   promove o member mais antigo a admin quando o último admin sai. Isso resolve o
   caso "grupo órfão" na prática, mas não existe conceito de "owner" (o dono original).
   Decisão: manter como está OU introduzir role `owner` no enum e migrar
   `groups.created_by` para essa role?
2. **JogosAdmin × Produtos (achado 2.12)** — qual das duas telas vira a fonte
   única do catálogo? Catálogo editorial (JogosAdmin) ou operação de loja (Produtos)?
3. **opinion_mutes × blocked_users (achado 2.11)** — unificar num único mecanismo
   de bloqueio ou manter mute local por opinião como feature separada?
4. **Torneios — pontos em aberto no doc `07-torneios-eventos.md`** —
   revisar após decisão de produto sobre premiação automática vs manual.

## 🔧 Aberto — técnico, ainda não priorizado

- **2FA para admins** — precisa fluxo novo em `DesktopLogin` + `manage-employee`.
- **Sanitizar `dangerouslySetInnerHTML`** nos componentes de cosméticos
  (`src/components/cosmetics/`). Usar `DOMPurify`.
- **`notification_preferences` respeitado em triggers** — hoje os triggers
  `notify_*` inserem em `notifications` sem checar preferência do destinatário.
- **Warnings do linter Supabase** (189 pré-existentes, ver `supabase--linter`):
  extensões no schema `public`, alguns `SECURITY DEFINER` executáveis por anon
  que poderiam ser restritos a `authenticated`.
- **Sanitizar `SEO/OG tags` dinâmicos** em `PublicProfile`, `SellerProfile`,
  `GameDetail` (achado recorrente no doc de auditoria web).
- **`FriendProfile` × `PublicProfile`** — unificar para uma rota única com
  layout dinâmico baseado em `can_see_full` da RPC.

## Próximo passo sugerido

Responder às 4 decisões de produto acima. Enquanto isso, o técnico pendente
pode ser atacado em ordem: **sanitize XSS cosmetics → notification_preferences
em triggers → 2FA admin → unificar Friend/PublicProfile**.
