-- ============================================================
-- ATS ASCENDA — Sprint 1
-- Row-Level Security (multitenancy) + Anonimização LGPD
-- Aplicar APÓS `prisma migrate` gerar as tabelas.
--
-- NOTA: o Prisma NÃO converte nomes de coluna para snake_case.
-- Os campos ficam como no schema (camelCase), portanto exigem
-- identificadores entre aspas duplas no Postgres: "tenantId".
-- Os nomes de TABELA usam @@map (snake_case) e dispensam aspas.
-- ============================================================

-- Contexto de tenant por transação.
-- A aplicação executa, no início de cada requisição:
--   SELECT set_config('app.current_tenant', '<tenant_uuid>', true);
-- O flag `true` mantém o valor apenas na transação corrente.

CREATE OR REPLACE FUNCTION app_current_tenant()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tenant text;
BEGIN
  v_tenant := current_setting('app.current_tenant', true);
  IF v_tenant IS NULL OR v_tenant = '' THEN
    RAISE EXCEPTION 'app.current_tenant nao definido para a sessao';
  END IF;
  RETURN v_tenant::uuid;
END;
$$;

-- ------------------------------------------------------------
-- Habilita RLS + policy de isolamento por tenant em cada tabela.
-- FORCE garante que até o owner da tabela respeite a policy.
-- ------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'users',
    'candidates',
    'candidate_sensitive_data',
    'resumes',
    'jobs',
    'pipelines',
    'pipeline_stages',
    'applications',
    'stage_history',
    'consents',
    'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);

    -- Idempotente: dropa a policy antes de recriar (o bootstrap pode rodar de
    -- novo em restarts de serviço).
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', tbl);
    -- "tenantId" entre aspas: coluna case-sensitive gerada pelo Prisma.
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
      USING ("tenantId" = app_current_tenant())
      WITH CHECK ("tenantId" = app_current_tenant());
    $f$, tbl);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- Audit log: append-only. Bloqueia UPDATE/DELETE mesmo dentro do tenant.
-- (A policy tenant_isolation cobre INSERT/SELECT.)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS audit_no_update ON audit_logs;
CREATE POLICY audit_no_update ON audit_logs
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS audit_no_delete ON audit_logs;
CREATE POLICY audit_no_delete ON audit_logs
  FOR DELETE
  USING (false);

-- ============================================================
-- ANONIMIZAÇÃO LGPD
-- Substitui PII por marcador irreversível preservando integridade
-- estatística (mantém linhas para métricas de diversidade/funil).
-- ============================================================
CREATE OR REPLACE FUNCTION anonymize_candidate(p_candidate_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant uuid := app_current_tenant();
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM candidates
    WHERE id = p_candidate_id AND "tenantId" = v_tenant
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Candidato % nao encontrado no tenant corrente', p_candidate_id;
  END IF;

  -- Substitui PII direta por marcador irreversível (hash do id).
  UPDATE candidates
  SET
    "fullName"     = 'ANONIMIZADO',
    email          = 'anon+' || encode(digest(id::text, 'sha256'), 'hex') || '@anon.local',
    phone          = NULL,
    status         = 'ANONYMIZED',
    "anonymizedAt" = now(),
    "deletedAt"    = COALESCE("deletedAt", now())
  WHERE id = p_candidate_id AND "tenantId" = v_tenant;

  -- Remove dados sensíveis brutos.
  DELETE FROM candidate_sensitive_data
  WHERE "candidateId" = p_candidate_id AND "tenantId" = v_tenant;

  -- Registra a operação no audit log (append-only).
  INSERT INTO audit_logs (id, "tenantId", action, entity, "entityId", metadata, "createdAt")
  VALUES (
    gen_random_uuid(),
    v_tenant,
    'ANONYMIZE',
    'Candidate',
    p_candidate_id,
    jsonb_build_object('reason', 'LGPD_right_to_erasure'),
    now()
  );
END;
$$;

-- ============================================================
-- ROLLBACK (referência)
-- ============================================================
-- DROP FUNCTION IF EXISTS anonymize_candidate(uuid);
-- DROP FUNCTION IF EXISTS app_current_tenant();
-- (policies caem com DROP POLICY / DISABLE ROW LEVEL SECURITY)
