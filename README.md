<div align="center">

# ✳ ClinicFlow

### CRM SaaS para clínicas e equipes de atendimento, com WhatsApp Cloud API

**Contatos • Conversas • Pipeline • Dashboard • Workspaces isolados**

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-2ab99f)

**Uma aplicação de portfólio funcional em código, com dados fictícios e envio simulado por padrão.**

</div>

---

## 💡 Sobre o projeto

O **ClinicFlow** é um MVP full stack de gestão de relacionamento com clientes (CRM), inspirado nas necessidades operacionais de clínicas, consultórios e negócios de serviços. O projeto reúne atendimentos, contatos e negociações em um painel responsivo.

O backend integra a **WhatsApp Business Platform (Cloud API oficial da Meta)** para receber webhooks e enviar mensagens de texto **quando as credenciais reais forem configuradas**. No modo inicial `mock`, o sistema simula envios, sem enviar nenhuma mensagem ao WhatsApp.

### Funcionalidades

| Módulo | Implementação |
| --- | --- |
| **Acesso e SaaS** | Cadastro de workspace, login, senha com hash bcrypt, sessão HTTP-only, separação por organização |
| **Dashboard** | Indicadores de contatos, negociações, receitas ganhas, mensagens não lidas, tendência mensal |
| **Contatos** | Cadastro, edição, busca, etiquetas, telefone normalizado e registro de consentimento |
| **Funil de vendas** | Oportunidades associadas a contatos, cinco etapas, valores e mudança de status |
| **Inbox** | Lista de conversas, histórico, marcação de mensagens lidas e campo de resposta |
| **WhatsApp** | API oficial de envio, webhooks GET/POST, assinatura HMAC-SHA256, status de entrega, deduplicação por ID |
| **Integrações** | Configuração por organização, credencial criptografada AES-256-GCM |
| **Experiência** | Interface responsiva em português, estado vazio, formulários validados, mensagens de erro |
| **DevEx** | Docker Compose, seed fictício, teste unitário e workflow de CI |

> **Limites deste MVP:** não possui faturamento/assinaturas, fila de jobs, templates WhatsApp, testes E2E, edição de equipes ou funcionalidades de prontuário médico. “SaaS” aqui se refere principalmente à estrutura multitenant e ao cadastro de organizações — **não** à cobrança recorrente.

## 🛠️ Stack

- **Frontend:** React 19, TypeScript, Vite 6, Lucide React, CSS responsivo sem framework pesado.
- **API:** Node.js 20+, Express, TypeScript, Zod, bcryptjs, `pg`.
- **Banco:** PostgreSQL 16 (via Docker), SQL parametrizado e índices por organização.
- **Integração:** Meta Graph API (versão configurável), webhook assinado, modo mock/live.
- **Qualidade:** Vitest, TypeScript estrito, CI GitHub Actions.

## ▶️ Rodar localmente (Windows, macOS ou Linux)

**Pré-requisitos:** Node.js 20.19+ com npm e Docker Desktop / Docker Engine.

```bash
# 1. Na pasta do projeto
npm install

# 2. Configure variáveis (copie apps/api/.env.example para apps/api/.env)
# Windows PowerShell:
Copy-Item apps/api/.env.example apps/api/.env
# macOS/Linux:
# cp apps/api/.env.example apps/api/.env

# 3. Gere uma chave hex de 32 bytes (para integração WhatsApp real)
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
# Cole o resultado em APP_ENCRYPTION_KEY do arquivo apps/api/.env

# 4. Inicie o PostgreSQL
# Porta 5433 no computador; a porta do container permanece 5432
docker compose up -d --wait

# 5. Crie tabelas e dados demonstrativos
npm run db:setup

# 6. Suba backend e frontend
npm run dev
```

Abra **http://localhost:5173**.

**Conta fictícia de demonstração (apenas desenvolvimento):**

| Campo | Valor |
| --- | --- |
| E-mail | `demo@clinicflow.local` |
| Senha | `Demo@12345` |

Também é possível clicar em **Criar workspace** e cadastrar uma organização totalmente separada.

> Não utilize a conta e a senha demonstrativas em produção. O seed só popula o banco quando `SEED_DEMO=true` e `NODE_ENV` não é `production`. Nunca publique arquivos `.env` ou segredos reais.

### Outros comandos

```bash
npm run check       # Checagem de tipos
npm run test        # Testes unitários
npm run build       # Build das duas aplicações
npm run db:setup    # Cria schema e adiciona seed idempotente (em desenvolvimento)
docker compose down # Para o banco, mantém os dados no volume
docker compose down -v # Apaga volume e dados: atenção!
```

## 💬 Conectar à WhatsApp Cloud API oficial

**Sem configurar tokens e sem alterar `WHATSAPP_MODE`, os envios serão sempre simulados.** A organização demonstrativa é bloqueada para envios reais, inclusive se o servidor for alternado para `live`; use um workspace novo para testar o canal verdadeiro.

1. Crie/configure um app de negócios no [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api/), habilite WhatsApp e obtenha um **Phone Number ID** e **Access Token**.
2. No backend, preencha `META_APP_SECRET` e `META_VERIFY_TOKEN` em `apps/api/.env`, além de uma `APP_ENCRYPTION_KEY` aleatória válida.
3. No ClinicFlow, vá para **Configurações → WhatsApp** e grave os dados do número por workspace. O access token é guardado cifrado; não vai para o frontend depois do cadastro.
4. Exponha a API em um endereço **HTTPS público** e cadastre o callback `https://SEU-DOMINIO/api/webhooks/whatsapp` na Meta, usando o mesmo verify token. Inscreva o campo `messages`.
5. Configure `WHATSAPP_MODE=live` e reinicie o backend. Respostas de texto são permitidas somente dentro da janela de **24 horas após uma mensagem recebida**; para mensagens iniciadas pela empresa ou fora dessa janela, é necessário um template aprovado (não implementado).
6. Use números autorizados e confira políticas e custos vigentes da Meta. **Não é preciso configurar acesso real para demonstrar o produto no portfólio.**

O endpoint `GET` confirma o webhook pelo token de verificação. O `POST` valida `X-Hub-Signature-256` sobre **os bytes brutos**, roteia eventos pelo `phone_number_id`, evita duplicatas e acompanha status de entrega.

**Importante:** a Meta pode cobrar por mensagens, inclusive mensagens de atendimento conforme o período e mercado. Consulte a [documentação comercial da Meta](https://developers.facebook.com/docs/whatsapp/pricing/) antes de ativar o modo real.

## 🗂️ Estrutura

```text
clinicflow-crm-whatsapp/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── lib/           # sessão, criptografia, webhook, conexão PG
│   │   │   ├── routes/        # auth, dashboard, contatos, deals, inbox, WhatsApp
│   │   │   ├── schema.sql
│   │   │   ├── seed.ts
│   │   │   └── server.ts
│   │   └── .env.example
│   └── web/
│       └── src/               # aplicativo React, tipagens, estilos
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

## 🔐 Privacidade e produção

Este é um **projeto didático**, não homologado para dados de pacientes. Todas as informações do seed são inventadas. Não cadastre dados sensíveis ou prontuários reais neste MVP.

Antes de usar comercialmente, implemente e valide: LGPD (base legal, retenção, eliminação, solicitações dos titulares), HTTPS com domínio próprio, autenticação robusta e recuperação de senha, verificação de e-mail, rate limiting adicional, auditoria, políticas de backup, testes de integração/E2E, observabilidade, isolamento/testes de autorização, filas com retry para webhooks e idempotência de envios. Não coloque dados de saúde em mensagens ou logs sem requisitos apropriados.

Mais detalhes em [Arquitetura](docs/ARCHITECTURE.md), [API](docs/API.md) e [Segurança](SECURITY.md).

## 🚀 Próximas evoluções

- [ ] Equipes e papéis com convites
- [ ] Templates aprovados pelo WhatsApp e disparos com consentimento
- [ ] Assinaturas e cobrança por workspace
- [ ] Jobs de mensageria/filas, retentativas e DLQ
- [ ] Filtros avançados, automações e métricas de atendimento
- [ ] Testes E2E e ambiente de demonstração publicado

---

**Feito como projeto de portfólio para demonstrar arquitetura full stack, UX, autenticação, multi-tenancy e integrações externas.**
