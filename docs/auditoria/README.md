# Auditoria MIDIAS

Documentação viva do ecossistema **MIDIAS** — não é doc de tela, é o **porquê** de cada página existir, como ela se conecta ao resto, e o que precisa mudar.

Escrita para servir **três públicos ao mesmo tempo**:

1. **Banca de TCC** — entender arquitetura, decisões de UX e regras de negócio sem ler código.
2. **Dev/designer novo** — onboarding em uma tarde: ler o glossário, os fluxos globais, e o arquivo da página em que vai mexer.
3. **Você (product owner)** — ter uma base honesta do que está bom, do que está ruim, e para onde levar o produto.

---

## Como ler

- Comece por **`_glossario.md`** — sem ele, palavras como "Órbita", "Radar", "Escolha do Dia", "Bundle" não têm significado canônico e viram sinônimos falsos.
- Depois **`_fluxos-globais.md`** — os 7 fluxos-mãe que atravessam várias páginas. É onde o ecossistema "acontece".
- Só então abra a página que te interessa em `web/NN-nome.md`. Cada arquivo é autoexplicativo, mas assume o glossário.

---

## Convenções

### Níveis de prioridade nas críticas / melhorias

| Nível | Significado                                                                       |
| ----- | --------------------------------------------------------------------------------- |
| P0    | Bloqueia experiência básica ou trava a Fase B/C. Resolver antes de qualquer coisa.|
| P1    | Prejudica adoção/conversão de forma mensurável. Resolver no próximo ciclo.        |
| P2    | Melhoria de qualidade, polimento, feature futura. Backlog.                        |

### Status de cada documento

| Status     | Significado                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `rascunho` | Estrutura pronta, precisa de revisão de conteúdo.                        |
| `revisão`  | Conteúdo completo, aguardando validação do product owner.                |
| `final`    | Validado. Pode ser citado no TCC / apresentado à banca.                  |

### Referências a código

Sempre no formato `src/pages/Arquivo.tsx:linha` para rastreabilidade. Ex.: `src/pages/Home.tsx:42`.

### Diagramas

- **Mermaid** para fluxos e árvores de decisão (renderiza no GitHub, no Lovable e em PDF).
- **ASCII** para estrutura vertical de página (mais legível impresso).
- **Sem emojis dentro de blocos mermaid** — quebra o lexer. Emojis livres no texto corrido.

---

## Estrutura

```text
docs/auditoria/
├── README.md              ← você está aqui
├── _template.md           ← template dos 20 tópicos (reutilizado nas fases B e C)
├── _glossario.md          ← vocabulário canônico do MIDIAS
├── _fluxos-globais.md     ← 7 fluxos-mãe cross-página
└── web/
    ├── 01-home.md         ← porta de entrada; a mais complexa
    ├── 02-catalogo.md     ← listagem completa filtrável
    ├── 03-ofertas.md      ← curadoria de descontos
    ├── 04-em-alta.md      ← descoberta por sinais coletivos
    ├── 05-pra-voce.md     ← descoberta personalizada
    ├── 06-game-detail.md  ← página-produto; a segunda mais complexa
    ├── 07-bundle-detail.md ← combo de jogos com desconto
    └── 08-torneios.md     ← hub competitivo
```

---

## Roadmap da auditoria

| Fase | Escopo                                                                 | Status         |
| ---- | ---------------------------------------------------------------------- | -------------- |
| A    | Web pública (8 páginas) — este diretório `web/`                        | em execução    |
| B    | Mobile Flutter (MHome, MMarketplace, MForum, MChat, MProfile, etc.)    | planejada      |
| C    | Desktop Admin (~30 telas em `src/desktop/pages/`)                      | planejada      |
| D    | Web autenticada de conta (Perfil, Biblioteca, Pedidos, Favoritos, ...) | planejada      |
| E    | Transversais (Auth, FAQ, Contato, Termos, Busca Global, Oportunidades) | planejada      |

Cada fase reusa `_template.md` e complementa o `_glossario.md` conforme surgirem termos novos.

---

## Índice das páginas auditadas (Fase A)

| #   | Página                                     | Rota            | Objetivo em 1 frase                                 | Status     |
| --- | ------------------------------------------ | --------------- | --------------------------------------------------- | ---------- |
| 01  | [Home](./web/01-home.md)                   | `/`             | Porta de entrada do ecossistema.                    | rascunho   |
| 02  | [Catálogo](./web/02-catalogo.md)           | `/catalogo`     | Ver todos os jogos com filtros e ordenação.         | rascunho   |
| 03  | [Ofertas](./web/03-ofertas.md)             | `/ofertas`      | Descobrir jogos em desconto agora.                  | rascunho   |
| 04  | [Em Alta](./web/04-em-alta.md)             | `/em-alta`      | Ver o que a comunidade está movimentando.           | rascunho   |
| 05  | [Pra Você](./web/05-pra-voce.md)           | `/pra-voce`     | Recomendação personalizada por comportamento.       | rascunho   |
| 06  | [Game Detail](./web/06-game-detail.md)     | `/jogo/:id`     | Toda a informação de um jogo específico.            | rascunho   |
| 07  | [Bundle Detail](./web/07-bundle-detail.md) | `/bundle/:id`   | Combo de jogos com preço e economia agregados.      | rascunho   |
| 08  | [Torneios](./web/08-torneios.md)           | `/torneios`     | Hub competitivo — eventos, inscrições, chaveamento. | rascunho   |

---

## Fora de escopo desta fase

- Diagramas C4 formais
- ADRs (Architecture Decision Records) formais
- ERD completo do banco
- Auditoria de segurança / LGPD (documento separado em `.lovable/memory/security/`)

Podem virar apêndices futuros se a banca pedir.
