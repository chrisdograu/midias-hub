

## Plano: G + análise de deficiências restantes

### Resposta direta — o que ainda falta (além do G)

Ao varrer o projeto, identifiquei o que **realmente** ainda é uma deficiência (sem inventar trabalho):

| # | Deficiência | Por que importa | Esforço |
|---|---|---|---|
| **G** | **Notificações em tempo real (toast)** no Desktop | Único item de tempo real ainda não entregue (badges já existem, falta o "alerta" sonoro/visual) | Baixo |
| H | **Filtros e busca no /desktop/clientes e /desktop/anuncios** — hoje listam tudo sem filtro | Lista cresce com o seed; fica difícil testar | Baixo |
| I | **Modal/visão detalhada das denúncias** em `/desktop/moderacao` — hoje só mostra `target_id` (UUID cru), sem link para o anúncio/post/usuário denunciado | Moderador precisa ver o conteúdo reportado para decidir | Médio |
| J | **Tela `/desktop/notificacoes` (admin)** — confirmar se está populada/funcional ou se é placeholder | Aparece no menu mas não verifiquei conteúdo | Baixo |
| K | **Reset de dados de teste por SQL no GUIA** — instruções estão genéricas; gerar um bloco SQL pronto para copiar | Acelera reuso do ambiente | Baixo |
| L | **Logs de acesso staff** (toggle "access_log" já existe em Configurações mas não grava nada) | Ou implementar tabela `staff_audit_log`, ou remover o switch para não enganar | Médio |

Itens **descartados** após verificação:
- ~~D (avaliações de usuário)~~ — **já existe** em `/desktop/avaliacoes-usuario` com CRUD completo.
- ~~E (fórum web)~~ — você decidiu manter mobile-only. ✓
- ~~Reset button (C)~~ — você dispensou. ✓

---

### Esta rodada: **G + I** (alto impacto, baixo/médio esforço)

Sugiro fazer juntos porque se completam: G alerta o admin de uma nova denúncia, I permite que ele entenda a denúncia ao clicar.

#### G — Notificações em tempo real no Desktop

**Como vai funcionar:**
1. Criar hook `useDesktopRealtimeAlerts()` que:
   - Escuta `INSERT` em `denuncias`, `pedidos`, `certificados`, `trade_proposals` via Supabase Realtime.
   - Para cada novo evento, dispara `toast()` (sonner) com:
     - Ícone + título ("Nova denúncia recebida", "Novo pedido", etc.)
     - Botão "Ver" que navega para a página correspondente.
   - Usa `mountedAt` (timestamp do load) para **ignorar registros antigos** — só notifica eventos chegados **depois** que o admin abriu o desktop (evita spam de "novo pedido" para pedidos de 3 dias atrás).
2. Plugar o hook em `DesktopLayout.tsx` (mesma condição do `useDesktopPending`).
3. **Som opcional**: tocar bipe leve (`new Audio('data:audio/wav;base64,...')`) — pode ser controlado por toggle em `site_settings.notification_prefs.sound`.

**Filtros por cargo:** moderador só recebe denúncias; atendente só pedidos; admin recebe tudo. Reusar `canAccess()` do `useDesktopAuth`.

#### I — Detalhe das denúncias em /desktop/moderacao

**Como vai funcionar:**
1. Adicionar coluna "Conteúdo" na tabela: ao invés do UUID, mostrar:
   - Se `target_type='anuncio'` → título do anúncio (lookup em `anuncios`)
   - Se `target_type='forum_post'` → trecho do post (lookup em `forum_posts`)
   - Se `target_type='profile'` → nome do usuário denunciado
   - Se `target_type='mensagem'` → trecho da mensagem
2. Adicionar botão **"Ver detalhes"** que abre Dialog com:
   - Conteúdo completo da denúncia (descrição, motivo, data)
   - Conteúdo completo do alvo (texto/imagem do anúncio, post, etc.)
   - Botão "Ir para o item" (link para `/desktop/anuncios?id=X`, etc.)
   - Ações rápidas no rodapé: **Resolver**, **Banir autor por X dias**, **Marcar como improcedente**.
3. Status de denúncia ganha uma 3ª opção: `pending` | `resolved` | `dismissed` (improcedente).

---

### Arquivos afetados

```text
NOVOS:
  src/hooks/useDesktopRealtimeAlerts.ts
  .lovable/memory/features/desktop-realtime-alerts.md

EDITADOS:
  src/desktop/DesktopLayout.tsx       (plugar o hook)
  src/desktop/pages/Moderacao.tsx     (coluna conteúdo + dialog detalhe)
  GUIA_DE_TESTES.md                   (adicionar passos de QA)
  .lovable/memory/index.md            (referência ao novo memory file)
```

Sem migração SQL necessária — o status `dismissed` já cabe no campo `text` existente.

---

### Próximo passo após esta rodada

Ficaria **H + J + K** como combo final de polimento. **L** (logs de acesso) requer decisão sua: implementar de verdade (criar tabela + triggers em todas as tabelas sensíveis) ou apenas remover o toggle. Recomendo **remover o toggle** — é uma feature grande para o escopo do TCC e o seu sistema já tem `movimentacoes_estoque` como log de auditoria operacional.

**Confirma G + I nesta rodada?**

