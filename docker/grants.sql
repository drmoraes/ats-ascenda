-- Concede ao role da aplicação (ats_app) o acesso mínimo necessário.
-- Aplicado após `prisma db push` criar o schema.

GRANT USAGE ON SCHEMA public TO ats_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ats_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ats_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ats_app;

-- Objetos futuros herdam as mesmas permissões.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ats_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ats_app;
