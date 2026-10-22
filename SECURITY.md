# Security Policy

Este repositório é um **MVP demonstrativo**, não uma aplicação médica certificada nem uma solução pronta para uso comercial com dados sensíveis.

## Regras de proteção

- Nunca comite `.env`, credenciais Meta, cookies ou bancos reais.
- Gere `APP_ENCRYPTION_KEY` única e guarde-a de maneira segura; perder a chave inviabiliza descriptografar os tokens existentes.
- O login demo só deve existir em desenvolvimento local.
- O modo padrão `mock` não envia mensagens.
- O webhook valida HMAC-SHA256 e não aceita assinatura ausente.
- A API aplica tenant scoping em cada consulta; examine novamente antes de incluir novos endpoints.

## Antes de produção

Necessário adicionar e revisar: RLS, CSRF defense aprofundada, e-mail verificado, rotação de sessão, proteção contra abuso, políticas de senha e recuperação, autorização granular, logs de auditoria, filas, backups, renovação de credenciais, testes automatizados integrados, HTTPS, termos de privacidade, LGPD, políticas de retenção e exclusão de dados.

Problemas de segurança devem ser relatados de forma privada ao mantenedor, sem divulgar credenciais ou dados pessoais em issues públicas.
