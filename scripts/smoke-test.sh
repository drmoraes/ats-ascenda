#!/usr/bin/env bash
# Smoke test do fluxo ponta a ponta contra o ambiente local (docker compose).
# Exercita: health -> token do recrutador -> vagas -> Kanban -> ranking ->
# analytics -> cadastro público de candidato -> URL de upload de currículo.
#
# Pré-requisitos: stack no ar (`make up`), `curl` e `jq` instalados.
# Sem `-e`: os loops de retry precisam tolerar falhas transitórias (Keycloak
# ainda subindo). As verificações explícitas (`|| fail`) tratam erros reais.
set -uo pipefail

API="${API_URL:-http://localhost:3000}"
KC="${KEYCLOAK_URL:-http://localhost:8080}"

info()  { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }
ok()    { printf '  \033[32m✓ %s\033[0m\n' "$1"; }
fail()  { printf '  \033[31m✗ %s\033[0m\n' "$1"; exit 1; }

require() { command -v "$1" >/dev/null 2>&1 || fail "comando ausente: $1"; }
require curl
require jq

info "1) Aguardando readiness da API ($API/health/ready)"
for i in $(seq 1 60); do
  if curl -sf "$API/health/ready" >/dev/null 2>&1; then ok "API pronta"; break; fi
  [ "$i" = "60" ] && fail "API não ficou pronta a tempo"
  sleep 3
done

info "2) Obtendo token do recrutador (Keycloak)"
TOKEN=""
for i in $(seq 1 30); do
  TOKEN=$(curl -s -X POST \
    "$KC/realms/ats/protocol/openid-connect/token" \
    -d grant_type=password -d client_id=ats-backend \
    -d username=recrutador@demo.com -d password=demo1234 \
    2>/dev/null | jq -r '.access_token // empty' 2>/dev/null || true)
  [ -n "$TOKEN" ] && { ok "token obtido"; break; }
  [ "$i" = "30" ] && fail "não consegui token do Keycloak (ainda importando o realm?)"
  sleep 3
done
AUTH=(-H "Authorization: Bearer $TOKEN")

info "3) Listando vagas"
JOBS=$(curl -s "${AUTH[@]}" "$API/jobs")
JOB_ID=$(echo "$JOBS" | jq -r '.[0].id // empty')
[ -n "$JOB_ID" ] || fail "nenhuma vaga encontrada (seed rodou?)"
ok "vaga: $(echo "$JOBS" | jq -r '.[0].title')  ($JOB_ID)"

info "4) Kanban da vaga"
curl -s "${AUTH[@]}" "$API/jobs/$JOB_ID/kanban" \
  | jq -r '.[] | "  \(.name): \(.cards | length) candidato(s)"'
ok "kanban carregado"

info "5) Disparando (re)cálculo de ranking"
ENQ=$(curl -s -X POST "${AUTH[@]}" "$API/jobs/$JOB_ID/ranking/rank")
ok "scoring enfileirado: $(echo "$ENQ" | jq -r '.enqueued') candidatura(s)"

info "6) Ranking atual (scores persistidos)"
curl -s "${AUTH[@]}" "$API/jobs/$JOB_ID/ranking" \
  | jq -r '.[] | "  \(.candidateName): \(.matchScore // "-")"' | head -8
ok "ranking lido"

info "7) People Analytics (overview)"
curl -s "${AUTH[@]}" "$API/analytics/overview" | jq '{sla, channelRoi}'
ok "analytics ok"

info "8) Cadastro público de candidato (página de carreira)"
REG=$(curl -s -X POST "$API/public/demo/candidates" \
  -H 'content-type: application/json' \
  -d '{"fullName":"Candidato Smoke","email":"smoke+'"$RANDOM"'@exemplo.com",
       "consents":[{"purpose":"RECRUITMENT_PROCESS","granted":true,"termsVersion":"v1"}]}')
CAND_ID=$(echo "$REG" | jq -r '.candidateId // empty')
SESSION=$(echo "$REG" | jq -r '.sessionToken // empty')
[ -n "$CAND_ID" ] && [ -n "$SESSION" ] || fail "cadastro público falhou: $REG"
ok "candidato criado: $CAND_ID (token de sessão emitido)"

info "9) Solicitando URL de upload de currículo (token do candidato)"
UP=$(curl -s -X POST "$API/candidates/$CAND_ID/resumes" \
  -H "Authorization: Bearer $SESSION" -H 'content-type: application/json' \
  -d '{"mimeType":"application/pdf"}')
echo "$UP" | jq -e '.upload.uploadUrl' >/dev/null 2>&1 \
  && ok "URL de upload pré-assinada emitida" \
  || fail "falha ao gerar URL de upload: $UP"

printf '\n\033[32m✔ Fluxo ponta a ponta OK.\033[0m\n'
