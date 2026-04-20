

## Plano: Ambiente de testes completo + análise de deficiências

### 1. Estado atual (resumo do banco)

| Recurso | Existem | Faltam para testar |
|---|---|---|
| Produtos | 12 | ✅ ok |
| Categorias | 8 | ✅ ok |
| Fornecedores | 4 | ✅ ok |
| Cupons | 3 | ✅ ok |
| Pedidos | 7 | ✅ ok |
| Avaliações de produto | 7 | ✅ ok |
| **Anúncios marketplace** | **0** | ❌ |
| **Fórum (posts/replies)** | **0** | ❌ |
| **Denúncias** | **0** | ❌ |
| **Certificados** | **0** | ❌ |
| **Clientes "comuns" para testar** | poucos | ❌ |

Já existem todos os funcionários (admin, gerente, moderadora, marketplace, 2 estoquistas, atendente).

### 2. O que vou criar — Guia de testes + seed de dados

**A. Documento `GUIA_DE_TESTES.md`** (na raiz) com:
- Lista de todas as contas de teste (email + senha) por papel
- Fluxos passo-a-passo para cada funcionalidade:
  - Cliente: cadastro, login, comprar com cupom, favoritar, avaliar, comentar review, ver biblioteca, pedir reset de senha
  - Admin: gerenciar produtos/categorias/fornecedores, banir usuário, ver relatórios, alterar configurações da loja
  - Gerente/Estoquista/Atendente/Moderador/Marketplace: o que cada um vê e pode fazer (RBAC)
  - Banimento: banir um cliente e validar que ele vê o banner global no Header e no Perfil, e que o RLS bloqueia ações sensíveis
  - Marketplace (mobile/web): publicar anúncio, denunciar, moderar
  - Fórum: postar, responder, moderar

**B. Seed de dados via SQL** (insert no banco existente):
- **3 clientes de teste** (`cliente1@teste.com`, `cliente2@teste.com`, `cliente3@teste.com`) — senha padrão `Teste@123` — com perfil completo (nome, bio, telefone)
- **1 cliente já banido** (`banido@teste.com`) com `banned_until = now() + 7 dias` para testar o banner imediatamente
- **6 anúncios** no marketplace (variando categoria, plataforma, condição) ligados aos clientes
- **3 fotos** de anúncio
- **4 posts de fórum** + **6 respostas** em produtos existentes
- **3 denúncias pendentes** (1 contra anúncio, 2 contra usuário) para a tela de Moderação
- **2 certificados** (1 pendente, 1 ativo) para a tela de Certificados
- **5 favoritos** distribuídos
- **Mensagens** de exemplo entre cliente e vendedor

**C. Edge Function `seed-test-users`** — necessária porque clientes precisam existir em `auth.users` (não posso inserir lá direto via SQL). A function:
- Cria os 4 usuários de teste via `supabase.auth.admin.createUser`
- Devolve os IDs que o seed SQL referencia
- Pode ser chamada uma vez pela tela de configurações (botão "Popular dados de teste") visível só para admin

### 3. Análise de deficiências encontradas

Pontos que percebi durante a análise e proponho corrigir:

1. **`ProtectedRoute` com `DEV_BYPASS = true`** — toda rota protegida está liberada sem login. Vou trocar para `false` (ou ler de env), senão o teste de banimento/perfil não reflete a realidade.
2. **Fórum sem UI no Web** — existe no banco e no Desktop (`ForumAdmin`), mas usuário web não tem onde postar. Para o TCC isso é ok (fórum é mobile), mas vale documentar no guia.
3. **Movimentações de estoque sem botão de exclusão de erro** — se admin errar uma movimentação manual, não há como reverter. Sugestão: deixar registrado no guia como "limitação por desenho" (auditoria).
4. **`profiles` sem trigger de proteção em `banned_until`** — qualquer admin pode editar; ok para o escopo, mas anotar no guia.
5. **Sem indicador no Desktop de quantos itens pendentes** existem (denúncias, certificados, pedidos pendentes) — sugestão para futuro: badges no menu lateral.

### 4. Ordem de execução

```text
1. Criar Edge Function seed-test-users (cria usuários auth + retorna IDs)
2. Migration de seed: anúncios, fórum, denúncias, certificados, favoritos, mensagens
3. Trocar DEV_BYPASS para false em ProtectedRoute
4. Adicionar botão "Popular dados de teste" em /desktop/configuracoes (admin only)
5. Escrever GUIA_DE_TESTES.md com contas, fluxos e checklist QA
6. Atualizar memórias (mem://features/seed-de-testes)
```

### Detalhes técnicos rápidos

```text
Contas de teste criadas pela edge function:
  cliente1@teste.com   senha: Teste@123   (comprador comum)
  cliente2@teste.com   senha: Teste@123   (vendedor marketplace)
  cliente3@teste.com   senha: Teste@123   (avaliador/comentarista)
  banido@teste.com     senha: Teste@123   (banned_until = now()+7d)

Funcionários (já existem, senha definida na criação original):
  admin2@midias.com           → Admin
  Roberto Gerente             → gerente
  Juliana Moderadora          → moderador
  Lucas Marketplace           → atendente_marketplace
  Paulo / 67                  → estoquista
  Carla Atendente             → atendente

Botão "Popular dados de teste" → invoke('seed-test-users')
  → idempotente (ON CONFLICT DO NOTHING em tudo)
```

**Confirma seguir nessa ordem (1→6)?** Posso também pular o passo 3 (manter `DEV_BYPASS` ligado para facilitar) se você preferir.

