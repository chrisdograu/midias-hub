
# Auditoria MIDIAS — Fase A (Web pública)

## Objetivo

Produzir uma **especificação funcional + arquitetural + UX + fluxos + regras de negócio** de cada página pública da versão Web do MIDIAS, no nível de profundidade que você descreveu (os 20 tópicos). Não é doc de tela — é o "porquê" do ecossistema.

O material serve simultaneamente para:
- Defesa de TCC (banca entende arquitetura sem ler código)
- Onboarding de qualquer dev/designer futuro
- Base para as Fases B (Mobile Flutter) e C (Desktop Admin) da auditoria

## Entregáveis

Estrutura de pastas nova:

```text
docs/
└── auditoria/
    ├── README.md                  ← índice + legenda + convenções + roadmap
    ├── _template.md               ← template dos 20 tópicos (referência)
    ├── _glossario.md              ← Radar, Órbita, Escolha do Dia, Bundle, etc.
    ├── _fluxos-globais.md         ← diagramas mermaid dos 6-8 fluxos-mãe cross-página
    └── web/
        ├── 01-home.md
        ├── 02-catalogo.md
        ├── 03-ofertas.md
        ├── 04-em-alta.md
        ├── 05-pra-voce.md
        ├── 06-game-detail.md
        ├── 07-bundle-detail.md
        └── 08-torneios.md
```

Total: **8 páginas auditadas + 4 documentos-base = 12 arquivos**.

## Template dos 20 tópicos (aplicado a cada página)

Cada arquivo `web/NN-pagina.md` segue esta ordem exata:

1. **Objetivo da página** — o que ela precisa entregar
2. **Filosofia** — por que ela existe dentro do MIDIAS (a pergunta que só ela responde)
3. **Usuários-alvo** — visitante / logado novo / logado recorrente / vendedor / admin; o que cada um enxerga
4. **Estrutura visual** — diagrama vertical (ASCII/mermaid) da ordem dos blocos + justificativa da ordem
5. **Componentes** — cada bloco explicado: o que é, o que mostra, quando aparece, quando some
6. **Fluxos de entrada** — de onde o usuário chega (links, deep-links, notificações, redirects)
7. **Fluxos de saída** — para onde ele vai naturalmente e por quê
8. **Navegação entre páginas** — como conversa com Perfil / Fórum / Marketplace / Torneios / Chat
9. **Regras de negócio** — o que pode/não pode; limites; validações
10. **Estados da interface** — loading, vazio, erro, offline, sem permissão, com muitos dados
11. **Permissões** — visitante / usuário / vendedor / mod / admin (matriz)
12. **Origem dos dados** — de onde vem cada bloco (tabela, view, cálculo, cache)
13. **Banco relacionado** — tabelas Supabase envolvidas + relação entre elas
14. **APIs / hooks** — `useProdutos`, `useRadarDelta`, `useBiblioteca`, edge functions
15. **Painel admin relacionado** — o que o admin gerencia dessa página, tela por tela, ação por ação, com o nível de detalhe do seu exemplo da Escolha do Dia (agendar? duplicar? cancelar? alerta de data vazia? histórico? calendário? preview?)
16. **Casos extremos** — jogo removido, estoque zerado, promoção expirada, usuário banido, sem internet, dados corrompidos
17. **Justificativa de UX/UI** — por que Radar antes de Bundles, por que Ofertas depois de Destaques, por que dark default, por que teal+roxo
18. **Escalabilidade** — comportamento com 100 / 10k / 1M produtos ou usuários
19. **Melhorias futuras** — Steam/Epic/Xbox, IA de recomendação, cross-sell, PWA offline, i18n
20. **Crítica da implementação atual** — dividida em:
    - **O que está bom e por quê** (manter, e como potencializar até virar excelente)
    - **O que está ruim e por quê** (remover/substituir, com a alternativa concreta)
    - **Dívida técnica visível** (pontos que vão travar a Fase B/C se não resolver agora)

## Documentos-base (feitos antes das páginas)

**`README.md`** — índice clicável, legenda de ícones, convenção de níveis (P0/P1/P2 para melhorias), status de cada página (rascunho / revisão / final), como ler.

**`_template.md`** — o template acima em branco, para reuso nas fases B e C.

**`_glossario.md`** — definição canônica de:
- Órbita (o "hoje" do ecossistema — o que se moveu)
- Radar / Radar Delta (motor de sinais 24h/72h que alimenta Órbita e Oportunidades)
- Escolha do Dia (destaque diário — auto vs manual)
- Bundle, Destaque, Oferta, Em Alta, Pra Você (diferenças reais entre eles — hoje há sobreposição)
- Cosmético, Título, Badge, XP, Nível
- Vendedor, Modo Férias, Certificado
- Spoiler Guard, Tópico Trancado, Solução

**`_fluxos-globais.md`** — diagramas mermaid dos fluxos que atravessam várias páginas:
- Descoberta → Compra (Home → GameDetail → Carrinho → Checkout → Biblioteca)
- Descoberta social (Home → GameDetail → Review → Perfil autor → Amigos)
- Comunidade (Fórum → Post → Perfil → Chat)
- Competitivo (Torneios → Evento → Grupo → Match → Chat ao vivo)
- C2C (Marketplace mobile → Anúncio → Chat → Proposta troca → Certificado)
- Notificação → Ação (Bell → item específico → contexto)
- Cosmético desbloqueado → Customização (Unlock Center → Perfil/Customização)

## Foco extra nas seções mais fracas hoje

Você mencionou preocupações específicas que vão receber tratamento aprofundado:

**Header poluído (Home)** — na seção 17 (UX) e 20 (Crítica) da Home:
- Contagem real de elementos no header hoje (logo + 6 links + busca + tema + bell + cosmetic bell + carrinho + perfil-dropdown com 8 itens) = 20+ affordances
- Comparação com padrões de referência (Steam, Epic, GOG, Itch)
- Proposta A: Header + Navbar secundária (categoria/descoberta desce, conta sobe)
- Proposta B: Header enxuto + command palette (⌘K)
- Proposta C: Manter, mas agrupar em clusters visuais
- Recomendação com justificativa

**Poluição vs enxutez em cada bloco** — para cada seção da Home (Órbita, Escolha do Dia, Bundles, Destaques, Ofertas, Mais Bem Avaliados) a seção 20 responde: *isso é redundante com outro bloco? o usuário faz scroll até aqui? qual métrica justifica manter?*

**Admin da Escolha do Dia** — modelo detalhado (item 15) que serve de referência para as outras auditorias:
- Calendário mensal com dots nos dias preenchidos
- Agendamento múltiplo, duplicação, cancelamento até 00:00 do dia
- Fallback quando data vazia (algoritmo assume, com badge "auto")
- Histórico de 90 dias com quem publicou / quantos cliques
- Alerta em dashboard quando <7 dias sem programação
- Regra anti-repetição (aviso se jogo apareceu nos últimos 30d)

**"Está faltando algo na análise?"** — na seção 20 de cada página adiciono um sub-bloco "**Ângulos que a análise inicial não cobriu**" onde levanto o que você não pediu mas deveria estar: acessibilidade (WCAG), performance (LCP/CLS por bloco), SEO por página, i18n futuro, comportamento com JS desativado, dark/light parity, mobile-web (não Flutter) fallback.

## Estilo de escrita

- **PT-BR**, tom técnico mas legível para banca não-técnica
- Diagramas em **mermaid** (renderizam no GitHub e no Lovable) e ASCII quando mais simples
- Referências a arquivos reais no formato `src/pages/Home.tsx:42` para rastreabilidade
- Cada afirmação forte na Crítica vem com evidência (linha do código, comportamento observado, dado)
- Zero emoji em diagramas mermaid (quebra lexer); emojis livres no texto
- Crítica no tom que você pediu: quando é bom, explico *por que é bom, por que manter, como levar de bom pra excelente*; quando é ruim, explico *por que é ruim, por que remover, e a substituição concreta com trade-offs*

## Ordem de execução

1. `README.md` + `_template.md` + `_glossario.md` + `_fluxos-globais.md` (a base — 1 rodada)
2. `01-home.md` completo (a mais complexa — serve de referência de qualidade — 1 rodada dedicada)
3. `02-catalogo.md` + `03-ofertas.md` (páginas de listagem — 1 rodada)
4. `04-em-alta.md` + `05-pra-voce.md` (descoberta algorítmica — 1 rodada)
5. `06-game-detail.md` (a segunda mais complexa — 1 rodada dedicada)
6. `07-bundle-detail.md` + `08-torneios.md` (fechamento — 1 rodada)

Total estimado: **6 rodadas de build**. Nenhuma alteração de código de app — só criação de arquivos `.md` em `docs/auditoria/`.

## Fora do escopo desta fase (fica para depois)

- Fase B: Mobile Flutter (MHome, MMarketplace, MForum, MChat, MProfile, MTournamentGroup…)
- Fase C: Desktop Admin (todas as ~30 telas de `src/desktop/pages/`)
- Fase D: Páginas Web autenticadas de conta (Perfil, Biblioteca, Pedidos, Favoritos, Conversas, Tutoriais, Vendedor)
- Fase E: Páginas transversais (Auth, ResetPassword, FAQ, Contato, Termos, Busca Global, Oportunidades)
- Diagramas C4, ADRs formais, ERD completo (podem virar apêndices se você quiser depois)

Aprova prosseguir com a Fase A nesse formato?
