# Deploy no Render (demo online, grátis)

Coloca o ATS ASCENDA no ar com uma URL pública, sem cartão de crédito, usando o
`render.yaml` na raiz do projeto (Blueprint com Postgres, Redis, API e Keycloak).

## ⚠️ Limitações honestas do free tier

Leia antes — é uma demo, não produção:

- **Serviços "dormem"** após ~15 min sem uso; a primeira chamada depois disso
  demora (cold start de ~30–60s).
- **Postgres grátis expira em ~30 dias** (o Render remove). Os dados são de
  exemplo (seed), então tudo bem para demonstrar.
- **Sem storage de arquivos.** A URL de upload de currículo é gerada, mas aponta
  para um S3 fictício — o upload real do PDF não funciona nesta demo.
- **Keycloak é pesado para 512MB.** Pode reiniciar/OOM. Se o login do recrutador
  falhar, suba **só** o serviço `ats-keycloak` para um plano pago (o resto fica
  no free). O fluxo público do candidato funciona sem Keycloak.

## Pré-requisito: código no GitHub

O Render faz deploy a partir de um repositório Git. Se o projeto ainda não está
no GitHub:

```bash
cd "/Users/danielmoraes/Documents/Claude/Projects/ATS  ASCENDA"
git init
git add .
git commit -m "ATS ASCENDA"
```

Crie um repositório vazio no GitHub (github.com/new) e siga as instruções de
"push an existing repository":

```bash
git remote add origin https://github.com/SEU_USUARIO/ats-ascenda.git
git branch -M main
git push -u origin main
```

## Deploy

1. Crie uma conta grátis em <https://render.com> (pode logar com o GitHub).
2. No dashboard: **New → Blueprint**.
3. Conecte o repositório `ats-ascenda`. O Render lê o `render.yaml` e mostra os
   4 recursos (postgres, redis, api, keycloak). Clique **Apply**.
4. Aguarde o build/deploy (alguns minutos). O Postgres e o Redis sobem primeiro;
   a API roda o bootstrap (schema → seed → RLS) no start.

## Passo pós-deploy (importante): apontar a API para o Keycloak

Na primeira subida, a API usa URLs placeholder do Keycloak. Depois que o serviço
`ats-keycloak` estiver no ar:

1. Copie a URL pública dele (ex.: `https://ats-keycloak.onrender.com`).
2. No serviço `ats-api` → **Environment**, ajuste:
   - `KEYCLOAK_ISSUER` = `https://<sua-url-keycloak>/realms/ats`
   - `KEYCLOAK_JWKS_URL` = `https://<sua-url-keycloak>/realms/ats/protocol/openid-connect/certs`
3. Salve → a API faz redeploy automático.

## Testar

Com as URLs dos serviços, rode o smoke test apontando para o ambiente online
(o script aceita as variáveis `API_URL` e `KEYCLOAK_URL`):

```bash
API_URL=https://ats-api.onrender.com \
KEYCLOAK_URL=https://ats-keycloak.onrender.com \
bash scripts/smoke-test.sh
```

Ou abra no navegador:

- Saúde: `https://ats-api.onrender.com/health/ready`
- Login admin do Keycloak: `https://ats-keycloak.onrender.com` (admin / senha
  gerada — veja em `ats-keycloak` → Environment → `KEYCLOAK_ADMIN_PASSWORD`).

Credenciais de recrutador semeadas: `recrutador@demo.com` / `demo1234`.

## Se algo falhar

- **API não sobe**: veja os logs do serviço `ats-api` no dashboard. Erros de
  `db push`/seed aparecem lá.
- **Login do recrutador falha**: quase sempre é o Keycloak (OOM no free, ou as
  URLs `KEYCLOAK_ISSUER/JWKS` ainda com placeholder — refaça o passo pós-deploy).
- **Primeira chamada lenta**: cold start; tente de novo após alguns segundos.
