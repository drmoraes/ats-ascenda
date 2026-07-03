# Deploy AGORA — ATS ASCENDA (demo no ar, Render free tier)

Runbook enxuto para colocar a **API no ar** hoje. Feito para o seu cenário:
tem GitHub, ainda não tem conta Render, ainda sem chave de LLM.

> **O que sobe:** API REST (NestJS) + Postgres + Redis + Keycloak.
> **O que NÃO existe ainda:** frontend (Next.js é Sprint 3+). Não há "site" para
> um usuário navegar — a demo é testada por `/health` e chamadas REST.

---

## Pré-checagem honesta (o que funciona e o que não)

| Recurso | Nesta demo grátis |
|---|---|
| API sobe e responde | ✅ Sim |
| Banco + seed + RLS (multitenancy) | ✅ Sim (dados de exemplo) |
| Fluxo público do candidato (REST) | ✅ Sim |
| Parsing de currículo com IA | ❌ Desativado (sem chave LLM real) |
| Upload real de PDF (S3) | ❌ Não (bucket fictício) |
| Login do recrutador (Keycloak) | ⚠️ Pode dar OOM em 512MB; requer passo pós-deploy |
| Persistência | ⚠️ Serviços "dormem"; Postgres grátis expira em ~30 dias |

Nada disso impede colocar no ar — só define o que dá para demonstrar.

---

## Passo 1 — Consertar o git e publicar no GitHub

⚠️ O `.git` atual está **corrompido** (a história aponta para um commit que não
existe mais). Precisa ser reinicializado. **Rode no SEU terminal** (o ambiente do
Cowork não tem permissão para apagar arquivos nesta pasta):

```bash
cd "/Users/danielmoraes/Documents/Claude/Projects/ATS  ASCENDA"
bash scripts/deploy-fix-and-push.sh
```

O script faz backup do `.git` velho, cria um commit limpo e publica no GitHub
(automático se você tiver o `gh` autenticado; senão ele imprime os 2 comandos
manuais de `git remote add` + `git push`).

## Passo 2 — Deploy no Render (Blueprint)

1. Crie conta grátis em <https://render.com> — **faça login com o GitHub** (mais
   simples, já autoriza o acesso ao repositório).
2. No dashboard: **New → Blueprint**.
3. Selecione o repositório `ats-ascenda`. O Render lê o `render.yaml` e mostra 4
   recursos: `ats-postgres`, `ats-redis`, `ats-api`, `ats-keycloak`.
4. Clique **Apply**. Aguarde o build (alguns minutos). O `render.yaml` já
   gera automaticamente os segredos sensíveis (`CANDIDATE_JWT_SECRET`,
   senha do admin do Keycloak, URLs de banco/redis). **Você não precisa digitar
   segredo nenhum para subir.**

## Passo 3 — Apontar a API para o Keycloak (pós-deploy)

Na 1ª subida a API usa URLs placeholder do Keycloak. Depois que `ats-keycloak`
estiver no ar:

1. Copie a URL pública dele (ex.: `https://ats-keycloak.onrender.com`).
2. Em `ats-api` → **Environment**, ajuste e salve:
   - `KEYCLOAK_ISSUER` = `https://<url-keycloak>/realms/ats`
   - `KEYCLOAK_JWKS_URL` = `https://<url-keycloak>/realms/ats/protocol/openid-connect/certs`
3. A API faz redeploy sozinha.

## Passo 4 — Testar

```
https://ats-api.onrender.com/health/ready      -> deve responder OK
```

Credenciais de recrutador semeadas: `recrutador@demo.com` / `demo1234`
(login depende do Keycloak estar de pé — ver caveat de OOM).

---

## Depois, quando quiser ligar tudo "de verdade"

- **Parsing com IA:** em `ats-api` → Environment, troque `AI_PARSER_API_KEY`
  pela sua chave real da Anthropic e faça redeploy. O `AI_PARSER_API_BASE_URL`
  e `AI_PARSER_MODEL` já estão configurados.
- **Upload de currículo real:** exige um bucket S3 (ou compatível, ex.: R2/MinIO)
  e credenciais reais em `AWS_*` / `S3_RESUMES_BUCKET`.
- **Keycloak estável:** suba **só** o serviço `ats-keycloak` para um plano pago
  (o resto permanece no free).
- **Produção real (AWS):** use `deploy/terraform/` + o workflow
  `.github/workflows/deploy.yml` (ECS Fargate + RDS Multi-AZ). Outro projeto.

## Se algo falhar

- **Build do Render falha:** o código não compilou. Veja o log do serviço
  `ats-api`; o mesmo build roda no CI (`.github/workflows/ci.yml`) a cada push.
- **API não sobe:** logs de `ats-api` mostram erros de `db push`/seed.
- **Login do recrutador falha:** quase sempre Keycloak (OOM no free ou URLs
  `KEYCLOAK_*` ainda placeholder — refaça o Passo 3).
- **1ª chamada lenta:** cold start do free tier; tente de novo em ~30–60s.
