

## Alinhamento — próximas necessidades

Respondendo suas dúvidas primeiro:

1. **`GUIA_DE_TESTES.md`** já existe na **raiz do projeto** (`/GUIA_DE_TESTES.md`, 7KB). Ele aparece no explorador de arquivos junto com `README.md`, `package.json`, etc. Vou apenas atualizá-lo removendo a instrução de clicar em "Popular dados de teste".
2. **Marketplace mobile vazio** — correto. O app mobile é **Flutter/Dart** (projeto separado, não está neste repositório). Os anúncios, fórum e mensagens criados pelo seed vivem no mesmo banco Supabase, então quando o app Flutter for rodado eles aparecerão lá. No web este conteúdo só é visível pelas telas do **Desktop** (`/desktop/anuncios`, `/desktop/forum`, `/desktop/mensagens`).
3. **Modo claro muito claro** — confirmado, vou suavizar.

---

## O que vou fazer agora

### 1. Remover botão "Popular dados de teste" (já não é mais necessário)
Em `src/desktop/pages/Configuracoes.tsx`:
- Remover state `seedingData`, função `handleSeedTestData`, ícone `Database` e o `Card` inteiro (linhas 157-176) da aba "Minha Conta".
- Manter a Edge Function `seed-test-users` no projeto (caso precise rodar de novo no futuro via SQL/CLI), só some da UI.

### 2. Suavizar o modo claro
Em `src/index.css` (bloco `.light`), trocar para um cinza mais confortável (estilo "off-white" / soft):
```text
--background:        0 0% 98%   →  220 14% 93%   (cinza levíssimo)
--card:              0 0% 100%  →  0   0% 99%    (off-white)
--popover:           0 0% 100%  →  0   0% 99%
--secondary:         220 14% 92% →  220 13% 87%
--muted:             220 14% 94% →  220 13% 89%
--border:            220 13% 87% →  220 13% 82%
--input:             220 13% 87% →  220 13% 84%
--sidebar-background:0 0% 97%   →  220 13% 90%
--sidebar-accent:    220 14% 92% →  220 13% 86%
--surface-hover:     220 14% 94% →  220 13% 88%
```
Resultado: fundo cinza-claro suave (em vez de branco quase puro), com cards levemente destacados, mantendo bom contraste de texto.

### 3. Atualizar `GUIA_DE_TESTES.md`
- Remover a frase introdutória "**Antes de começar**: entre em /desktop/configuracoes…".
- Substituir por um aviso simples: "Os dados de teste já foram populados. Use as credenciais abaixo."
- Manter a seção "Resetar dados de teste" (instrução SQL) intacta.

### 4. Análise — necessidades restantes (deficiências)

Mapeei o que ainda falta para o sistema ficar "redondo" para o TCC. Listo em ordem de impacto para você escolher o próximo passo:

| # | Item | Impacto | Esforço |
|---|---|---|---|
| A | **Badges no menu lateral do Desktop** mostrando contagem de denúncias pendentes, certificados pendentes e pedidos novos | Alto (UX admin) | Baixo |
| B | **Trigger de proteção em `profiles.banned_until`** — só admin verdadeiro (não gerente) pode editar | Médio (segurança) | Baixo |
| C | **Botão "Limpar dados de teste"** no Desktop — remove contas `@teste.com` e tudo gerado por elas | Médio (DX) | Médio |
| D | **Página `/desktop/avaliacoes-usuario`** — moderar reviews ofensivos (a tabela existe, falta CRUD) | Baixo | Médio |
| E | **Fórum web (read-only)** — listar `forum_posts` em `/comunidade` para o usuário web pelo menos visualizar | Baixo | Médio |
| F | **Reativar exportação PDF de relatórios** (estava pausado a seu pedido) | Médio | Médio |
| G | **Notificações em tempo real** — toast quando admin recebe nova denúncia/pedido (Supabase Realtime) | Baixo | Médio |

### 5. Ordem de execução desta rodada
```text
1. Remover botão de seed do Configuracoes.tsx
2. Suavizar paleta do modo claro em index.css
3. Atualizar GUIA_DE_TESTES.md (tirar instrução de seed)
4. Atualizar memória (mem://features/seed-de-testes — marcar como concluído)
```

Depois desses 4 ajustes, **escolha quais itens (A–G) da tabela seguimos** — sugiro **A + B** como próximo combo (alto impacto, baixo esforço).

