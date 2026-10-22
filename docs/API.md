# API REST — ClinicFlow

Base de desenvolvimento: `http://localhost:4000/api`. No frontend, o Vite faz proxy de `/api` para a porta 4000. Respostas JSON. Rotas privadas usam sessão HTTP-only `clinicflow_session` criada no login.

| Método | Endpoint | Função |
| --- | --- | --- |
| GET | `/health` | Verificação simples de processo |
| POST | `/auth/register` | Criar organização e usuário administrador |
| POST | `/auth/login` | Entrar no workspace |
| POST | `/auth/logout` | Revogar sessão |
| GET | `/auth/me` | Ver dados da sessão atual |
| GET | `/dashboard` | Indicadores, tendência mensal, mensagens recentes |
| GET | `/contacts?search=...` | Listar/buscar contatos (máx. 200) |
| POST | `/contacts` | Criar contato |
| PATCH | `/contacts/:id` | Atualizar contato ou arquivar (`archived`) |
| GET | `/deals` | Listar negociações (máx. 300) |
| POST | `/deals` | Criar negociação |
| PATCH | `/deals/:id` | Mudar etapa da negociação |
| GET | `/conversations` | Listar até 100 contatos/conversas |
| GET | `/conversations/:contactId/messages` | Últimas 100 mensagens; marca recebidas como lidas |
| POST | `/conversations/:contactId/messages` | Responder, simulada ou real |
| GET | `/settings/whatsapp` | Canal da organização, sem retornar token |
| PUT | `/settings/whatsapp` | Conectar/substituir token, apenas admin |
| DELETE | `/settings/whatsapp` | Desconectar, apenas admin |
| GET | `/webhooks/whatsapp` | Handshake da Meta |
| POST | `/webhooks/whatsapp` | Webhook autenticado da Meta |

## Exemplos

### Criar workspace

```json
POST /api/auth/register
{
  "organization": "Minha Empresa",
  "name": "Ana Silva",
  "email": "ana@example.org",
  "password": "exemplo-forte-123"
}
```

### Criar contato

```json
POST /api/contacts
{
  "name": "Marina Souza",
  "phone": "+55 (61) 99999-1234",
  "email": "marina@example.org",
  "tags": ["Avaliação"],
  "opted_in": true
}
```

### Criar oportunidade

```json
POST /api/deals
{
  "contact_id": "UUID_DO_CONTATO",
  "title": "Pacote de acompanhamento",
  "value_cents": 120000,
  "stage": "new"
}
```

O valor monetário é armazenado em **centavos de real**, evitando erros com ponto flutuante.

### Responder mensagem

```json
POST /api/conversations/UUID_DO_CONTATO/messages
{"body":"Olá! Que horário seria melhor?"}
```

No modo demo o status salvo é `simulated`. Com integração real, o retorno `sent` significa aceite inicial da API, **não confirmação de entrega ou leitura**.

## Erros e regras de acesso

- `400`: validação de payload.
- `401`: sessão ausente, inválida ou expirada.
- `403`: autorização insuficiente, ausência de consentimento ou origem não permitida.
- `404`: recurso não encontrado na organização autenticada.
- `409`: duplicação ou regra de negócio (por exemplo, janela de 24h encerrada).
- `429`: limite de tentativas de login/cadastro.
- `502` ou `504`: falha/timeout na integração Meta.
- `500`: falha de servidor (sem expor stack ao cliente).

## Regras WhatsApp

Endpoint público webhook = `GET/POST /api/webhooks/whatsapp`. O `POST` requer `X-Hub-Signature-256` calculado com `META_APP_SECRET` e o payload bruto. O `GET` requer `hub.mode=subscribe`, `hub.verify_token` e `hub.challenge`.
