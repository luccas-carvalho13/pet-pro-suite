-- Stub do schema auth para rodar as migrations do Supabase em Postgres local (Docker).
-- As migrations referenciam auth.users e auth.uid(); aqui criamos o mínimo para elas rodarem.

CREATE SCHEMA IF NOT EXISTS auth;

-- Tabela mínima compatível com as FKs (profiles.id -> auth.users.id, user_roles.user_id -> auth.users.id)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'
);

-- Role usada pelas políticas RLS "TO authenticated"
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END
$$;

-- Função usada pelas políticas RLS (auth.uid()). Em local retorna NULL; para testes você pode usar SET request.jwt.claim.sub = 'uuid'.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    NULL::uuid
  );
$$;

-- Permite ao usuário da conexão usar auth.uid()
GRANT USAGE ON SCHEMA auth TO petpro;
GRANT SELECT ON auth.users TO petpro;
