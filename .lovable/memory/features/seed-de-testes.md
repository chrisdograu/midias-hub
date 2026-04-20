---
name: Seed de dados de teste
description: Edge Function seed-test-users cria 4 clientes (Teste@123) e popula anúncios, fórum, denúncias, certificados, favoritos e mensagens
type: feature
---
A Edge Function `seed-test-users` (admin only) cria os usuários `cliente1@teste.com`, `cliente2@teste.com`, `cliente3@teste.com` e `banido@teste.com` (banido por 7 dias) com a senha `Teste@123`.
Em seguida popula 6 anúncios, 4 posts de fórum + respostas, 3 denúncias pendentes, 2 certificados (1 pendente + 1 ativo), 5 favoritos e mensagens de exemplo.
A função é **idempotente** (verifica existência antes de inserir).
Acionada pelo botão "Popular dados de teste" em `/desktop/configuracoes` → aba Minha Conta (visível apenas para admins).
Documentação completa em `GUIA_DE_TESTES.md` na raiz do projeto.
