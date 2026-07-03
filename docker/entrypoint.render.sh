#!/bin/sh
# Bootstrap da API no Render (free tier).
#
# Diferença para o entrypoint local: no Render há UM único usuário de banco
# (não-superusuário) — então não criamos role separado nem grants. O
# isolamento por tenant continua garantido porque as policies usam FORCE ROW
# LEVEL SECURITY (aplicam-se até ao dono das tabelas, que não é superusuário).
#
# Ordem: schema -> SEED (antes do RLS, para os inserts não esbarrarem nas
# policies) -> RLS -> start. O seed é idempotente; o RLS é idempotente
# (DROP POLICY IF EXISTS), tolerando restarts do serviço.
set -e
export TS_NODE_TRANSPILE_ONLY=1

echo "[render] aplicando schema (prisma db push)..."
npx prisma db push --skip-generate

echo "[render] populando dados de exemplo (antes do RLS)..."
npx ts-node --transpile-only prisma/seed.ts

echo "[render] aplicando policies de RLS (idempotente)..."
npx ts-node --transpile-only scripts/apply-sql.ts prisma/migrations/0001_init_rls/rls_policies.sql

echo "[render] iniciando a API..."
exec node dist/main.js
