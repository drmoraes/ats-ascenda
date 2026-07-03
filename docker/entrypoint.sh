#!/bin/sh
# Bootstrap do container da API: schema -> RLS -> grants -> seed -> start.
# Tarefas administrativas usam ADMIN_DATABASE_URL (superusuário); a API roda
# com DATABASE_URL (role ats_app, sujeito a RLS).
set -e

# ts-node em modo transpile-only: os scripts de bootstrap (prisma/seed.ts,
# scripts/apply-sql.ts) ficam fora do rootDir "src", então evitamos o
# type-check (TS6059) e apenas transpilamos.
export TS_NODE_TRANSPILE_ONLY=1

echo "[bootstrap] aplicando schema (prisma db push)..."
DATABASE_URL="$ADMIN_DATABASE_URL" npx prisma db push --skip-generate

echo "[bootstrap] aplicando policies de RLS..."
npx ts-node --transpile-only scripts/apply-sql.ts prisma/migrations/0001_init_rls/rls_policies.sql

echo "[bootstrap] concedendo permissões ao role da aplicação..."
npx ts-node --transpile-only scripts/apply-sql.ts docker/grants.sql

echo "[bootstrap] populando dados de exemplo (seed)..."
DATABASE_URL="$ADMIN_DATABASE_URL" npx ts-node --transpile-only prisma/seed.ts

echo "[bootstrap] iniciando a API..."
exec node dist/main.js
