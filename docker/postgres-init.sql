-- Executado uma vez na primeira inicialização do Postgres.
-- Cria o role da aplicação SEM privilégios de superusuário, para que as
-- policies de Row-Level Security sejam efetivamente aplicadas (superusuário
-- burla o RLS). As permissões de tabela são concedidas depois (grants.sql),
-- após o schema existir.

CREATE ROLE ats_app WITH LOGIN PASSWORD 'ats_app_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
