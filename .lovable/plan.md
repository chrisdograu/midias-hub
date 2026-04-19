

## Próximos passos (continuação do plano aprovado)

Já concluímos: **Fase 1** (banco), **Fase 2 parcial** (Configurações persistidas, Moderação com banimento, Relatórios CSV) e **Fase 3** (modal de pedido, abas de Bloqueados/Avaliações, Footer).

### Pendências da Fase 2 (Desktop)

1. **Pedidos Online** — modal de detalhes do pedido com itens, cliente, total e dropdown para alterar status (pending → confirmed → shipped → delivered/cancelled). O trigger `on_order_confirmed` já cuida do estoque automaticamente.
2. **Estoque** — botão "Movimentação manual" (modal com tipo entrada/saída/ajuste, quantidade, motivo) gravando em `movimentacoes_estoque` e atualizando `produtos.stock`.
3. **Categorias** — upload de imagem da categoria usando o bucket `product-images` (criar subpasta `categorias/`).
4. **Certificados** — revisar fluxo de aprovar/recusar com motivo obrigatório no recusar.

### Pendências da Fase 3 (Web)

5. **Auth** — adicionar link "Esqueci minha senha" na tela `/auth` que dispara `resetPasswordForEmail` apontando para `/reset-password`.

### Fase 4 — Polimento e segurança

6. **Trigger de banimento** — função `check_user_banned()` que valida `banned_until > now()` e bloqueia ações sensíveis (criar anúncio, postar no fórum, enviar mensagem). Sem isso, o banimento é apenas visual.
7. **Atualizar memórias**:
   - Atualizar `mem://features/desktop-settings-admin` (agora persiste no banco).
   - Criar `mem://database/site-settings` (estrutura singleton + chaves).
   - Criar `mem://features/moderacao-banimento` (fluxo de banir/desbanir).
8. **Verificar links órfãos** no Header/Footer/Perfil após as mudanças.

### Sugestão de melhorias adicionais (opcional)

- **Configurações refletidas no site**: nome/email/telefone salvos em `site_settings.store_info` aparecerem dinamicamente no Footer e na página de Contato.
- **Exportação PDF dos relatórios** (jsPDF + html2canvas) com gráficos renderizados.
- **Gráfico de movimentações de estoque** (entradas vs saídas dos últimos 30 dias) na página Estoque.

### Ordem sugerida de execução

```text
1. Pedidos Online (modal + status)        ← maior impacto operacional
2. Estoque (movimentação manual)          ← completa o ciclo de estoque
3. Auth (esqueci senha web)               ← rápido e essencial
4. Categorias (upload de imagem)          ← polimento visual
5. Trigger de banimento (segurança)       ← fecha a moderação
6. Configurações dinâmicas no site        ← bônus de integração
7. Atualizar memórias                     ← documentação final
```

**Posso seguir nessa ordem (1 → 7), ou prefere priorizar/remover algum item?**

