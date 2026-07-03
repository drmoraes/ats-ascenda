# ATS ASCENDA — Rodando o ambiente local

Sobe todo o stack (Postgres+pgvector, Redis, MinIO/S3, Keycloak, API) via Docker
Compose, com schema aplicado, Row-Level Security ativo, permissões e dados de
exemplo carregados.

## Pré-requisitos

- Docker + Docker Compose.
- (Opcional) Uma chave de IA para o parseamento de currículo. Sem ela, o upload
  funciona mas o job de parsing marca o currículo como `FAILED` (falha tratada,
  não quebra o sistema).

## Subir

```bash
# a partir da raiz do projeto
AI_PARSER_API_KEY=sua-chave docker compose up --build
```

Serviços expostos:

| Serviço   | URL                     |
|-----------|-------------------------|
| API       | http://localhost:3000   |
| Postgres  | localhost:5432          |
| Redis     | localhost:6379          |
| MinIO S3  | http://localhost:9000 (console :9001) |
| Keycloak  | http://localhost:8080 (admin/admin) |

O container da API roda o bootstrap automaticamente: `prisma db push` → aplica
RLS → concede permissões ao role `ats_app` (sem privilégios, para o RLS valer) →
seed idempotente → inicia a API.

Dados semeados: tenant `demo`, 1 vaga aberta ("Engenheiro(a) de Dados Sênior") e
8 candidatos distribuídos no funil, com `matchScore` calculado.

## Fluxo do recrutador (autenticado via Keycloak)

Obtenha um token (usuário `recrutador@demo.com` / senha `demo1234`):

```bash
TOKEN=$(curl -s -X POST \
  http://localhost:8080/realms/ats/protocol/openid-connect/token \
  -d grant_type=password -d client_id=ats-backend \
  -d username=recrutador@demo.com -d password=demo1234 | jq -r .access_token)
```

Liste vagas e veja o Kanban:

```bash
curl -s http://localhost:3000/jobs -H "Authorization: Bearer $TOKEN" | jq

JOB=$(curl -s http://localhost:3000/jobs -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
curl -s http://localhost:3000/jobs/$JOB/kanban -H "Authorization: Bearer $TOKEN" | jq
```

Mova um candidato de estágio:

```bash
# pegue um applicationId e um targetStageId do retorno do Kanban, então:
curl -s -X POST http://localhost:3000/applications/<applicationId>/move \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"targetStageId":"<stageId>"}' | jq
```

## Fluxo do candidato (página pública, sem login)

Cadastro na página de carreira do tenant `demo` — retorna um token de sessão:

```bash
SESSION=$(curl -s -X POST http://localhost:3000/public/demo/candidates \
  -H 'content-type: application/json' \
  -d '{"fullName":"Novo Candidato","email":"novo@exemplo.com",
       "consents":[{"purpose":"RECRUITMENT_PROCESS","granted":true,"termsVersion":"v1"}]}' \
  | jq -r .sessionToken)
```

Solicite a URL de upload do currículo (autenticado com o token de sessão):

```bash
CID=<candidateId retornado acima>
curl -s -X POST http://localhost:3000/candidates/$CID/resumes \
  -H "Authorization: Bearer $SESSION" -H 'content-type: application/json' \
  -d '{"mimeType":"application/pdf"}' | jq
```

## Notas importantes

- **RLS de verdade**: a API conecta como `ats_app` (não-superusuário), então as
  policies de isolamento por tenant são efetivamente aplicadas. Migrações e seed
  usam o superusuário (que burla RLS de propósito).
- **Upload MinIO a partir do host**: a URL pré-assinada aponta para o host
  `minio`. Para exercê-la do seu navegador/curl, adicione ao `/etc/hosts`:
  `127.0.0.1 minio`. (Dentro dos containers o download já funciona.)
- **Issuer do Keycloak**: os tokens têm `iss=http://localhost:8080/...` e o JWKS
  é buscado internamente em `http://keycloak:8080/...`. O `jose` valida os dois
  separadamente, então a divergência host/container é intencional e correta.
- **Segredos**: os valores no compose são apenas para desenvolvimento. Em
  produção, use Secrets Manager / variáveis de ambiente reais.

## Testes

```bash
npm install
npm test          # 38 testes unitários (sem infra)
npm run typecheck  # requer `npx prisma generate` antes
```
