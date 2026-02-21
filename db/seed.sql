-- Seed: 1 empresa de teste + 3 usuários (usuario, admin, superadmin)
-- SENHAS: usuario@petpro.local | admin@petpro.local | super@petpro.local  →  Senha123!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.companies (id, name, cnpj, status)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'FourPet Pro Demo',
  '00.000.000/0001-00',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email, raw_user_meta_data, encrypted_password)
VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 'usuario@petpro.local', '{"full_name": "Usuário Comum"}'::jsonb, crypt('Senha123!', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222202'::uuid, 'admin@petpro.local',   '{"full_name": "Admin da Empresa"}'::jsonb, crypt('Senha123!', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222203'::uuid, 'super@petpro.local',   '{"full_name": "Super Admin"}'::jsonb, crypt('Senha123!', gen_salt('bf')))
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  encrypted_password = EXCLUDED.encrypted_password;

UPDATE public.profiles
SET company_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE id IN (
  '22222222-2222-2222-2222-222222222201'::uuid,
  '22222222-2222-2222-2222-222222222202'::uuid,
  '22222222-2222-2222-2222-222222222203'::uuid
);

INSERT INTO public.user_roles (user_id, role, company_id)
VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 'usuario',    '11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222202'::uuid, 'admin',      '11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222203'::uuid, 'superadmin', '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (user_id, role, company_id) DO NOTHING;

-- Dados da empresa demo (company_id = 11111111-1111-1111-1111-111111111111)

-- Clientes
INSERT INTO public.clients (id, company_id, name, email, phone) VALUES
  ('33333333-3333-3333-3333-333333333301'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Maria Silva', 'maria@email.com', '(11) 98765-4321'),
  ('33333333-3333-3333-3333-333333333302'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'João Santos', 'joao@email.com', '(11) 91234-5678'),
  ('33333333-3333-3333-3333-333333333303'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ana Costa', 'ana@email.com', '(11) 99876-5432'),
  ('33333333-3333-3333-3333-333333333304'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Carlos Lima', 'carlos@email.com', '(11) 97654-3210'),
  ('33333333-3333-3333-3333-333333333305'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Paula Santos', 'paula@email.com', '(11) 96543-2109')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone;

-- Pets (Maria:Rex,Bob | João:Mimi | Ana:Bob | Carlos:Luna | Paula:Thor)
INSERT INTO public.pets (id, company_id, client_id, name, species, breed) VALUES
  ('44444444-4444-4444-4444-444444444401'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333301'::uuid, 'Rex', 'Cão', 'Golden Retriever'),
  ('44444444-4444-4444-4444-444444444402'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333302'::uuid, 'Mimi', 'Gato', 'Siamês'),
  ('44444444-4444-4444-4444-444444444403'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333303'::uuid, 'Bob', 'Cão', 'Vira-lata'),
  ('44444444-4444-4444-4444-444444444404'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333304'::uuid, 'Luna', 'Cão', 'Pastor Alemão'),
  ('44444444-4444-4444-4444-444444444405'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333305'::uuid, 'Thor', 'Cão', 'Bulldog')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, species = EXCLUDED.species, breed = EXCLUDED.breed;

-- Serviços
INSERT INTO public.services (id, company_id, name, category, duration_minutes, price, commission_pct) VALUES
  ('55555555-5555-4555-8555-555555555501'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Consulta Veterinária', 'Veterinário', 30, 150.00, 40),
  ('55555555-5555-4555-8555-555555555502'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Banho e Tosa Pequeno Porte', 'Estética', 60, 80.00, 50),
  ('55555555-5555-4555-8555-555555555503'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Banho e Tosa Grande Porte', 'Estética', 90, 120.00, 50),
  ('55555555-5555-4555-8555-555555555504'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Vacinação V10', 'Veterinário', 15, 90.00, 30),
  ('55555555-5555-4555-8555-555555555505'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Tosa Higiênica', 'Estética', 30, 50.00, 50),
  ('55555555-5555-4555-8555-555555555506'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Cirurgia Castração', 'Veterinário', 120, 600.00, 35)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, duration_minutes = EXCLUDED.duration_minutes, price = EXCLUDED.price, commission_pct = EXCLUDED.commission_pct;

-- Produtos (estoque)
INSERT INTO public.products (id, company_id, name, category, stock, min_stock, price) VALUES
  ('66666666-6666-4666-8666-666666666601'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ração Premium Cães', 'Alimentos', 45, 20, 159.90),
  ('66666666-6666-4666-8666-666666666602'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Ração Premium Gatos', 'Alimentos', 15, 20, 139.90),
  ('66666666-6666-4666-8666-666666666603'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Shampoo Antipulgas', 'Higiene', 8, 15, 45.90),
  ('66666666-6666-4666-8666-666666666604'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Coleira Ajustável', 'Acessórios', 30, 10, 29.90),
  ('66666666-6666-4666-8666-666666666605'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Vacina Antirrábica', 'Medicamentos', 50, 25, 85.00),
  ('66666666-6666-4666-8666-666666666606'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Areia Sanitária', 'Higiene', 12, 20, 34.90)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, stock = EXCLUDED.stock, min_stock = EXCLUDED.min_stock, price = EXCLUDED.price;

-- Agendamentos (limpa e insere para idempotência)
DELETE FROM public.appointments WHERE company_id = '11111111-1111-1111-1111-111111111111'::uuid;
INSERT INTO public.appointments (company_id, client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333301'::uuid, '44444444-4444-4444-4444-444444444401'::uuid, '55555555-5555-4555-8555-555555555501'::uuid, (CURRENT_DATE + TIME '09:00')::timestamptz, 30, 'confirmed', 'Dr. João'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333302'::uuid, '44444444-4444-4444-4444-444444444402'::uuid, '55555555-5555-4555-8555-555555555504'::uuid, (CURRENT_DATE + TIME '10:30')::timestamptz, 15, 'confirmed', 'Dr. João'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444403'::uuid, '55555555-5555-4555-8555-555555555502'::uuid, (CURRENT_DATE + TIME '11:00')::timestamptz, 60, 'in_progress', 'Maria'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333304'::uuid, '44444444-4444-4444-4444-444444444404'::uuid, '55555555-5555-4555-8555-555555555501'::uuid, (CURRENT_DATE + TIME '14:00')::timestamptz, 30, 'scheduled', 'Dr. João'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333305'::uuid, '44444444-4444-4444-4444-444444444405'::uuid, '55555555-5555-4555-8555-555555555501'::uuid, (CURRENT_DATE + TIME '15:00')::timestamptz, 30, 'confirmed', 'Dra. Ana');

-- Transações: receitas e despesas (limpa e insere para idempotência)
DELETE FROM public.transactions WHERE company_id = '11111111-1111-1111-1111-111111111111'::uuid;
INSERT INTO public.transactions (company_id, type, date, description, category, value, status) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'revenue', CURRENT_DATE - 1, 'Consulta - Max (Golden)', 'Serviço', 150.00, 'paid'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'revenue', CURRENT_DATE - 1, 'Banho e Tosa - Luna (Poodle)', 'Serviço', 80.00, 'paid'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'revenue', CURRENT_DATE, 'Ração Premium 15kg', 'Produto', 159.90, 'pending'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'revenue', CURRENT_DATE, 'Vacinação V10 - Thor (Pastor)', 'Serviço', 90.00, 'paid'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'expense', CURRENT_DATE - 5, 'Fornecedor - Ração Pet Food', 'Compras', 2500.00, NULL),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'expense', CURRENT_DATE - 3, 'Energia Elétrica', 'Operacional', 450.00, NULL),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'expense', CURRENT_DATE - 2, 'Medicamentos Diversos', 'Compras', 890.00, NULL),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'expense', CURRENT_DATE - 2, 'Salários', 'Pessoal', 8500.00, NULL);
