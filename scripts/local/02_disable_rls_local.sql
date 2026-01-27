-- Desativa RLS nas tabelas públicas para uso local (DBeaver, scripts, etc.).
-- Em produção o Supabase usa RLS com auth.uid(); em local o usuário petpro não tem JWT, então desativar RLS permite ver/editar dados.

ALTER TABLE IF EXISTS public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
