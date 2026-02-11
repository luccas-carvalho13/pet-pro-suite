-- Garante a coluna encrypted_password em auth.users (hash bcrypt para login/cadastro).
-- Necessário se auth.users foi criada sem essa coluna (ex.: por outro script ou versão antiga do stub).
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS encrypted_password TEXT;
