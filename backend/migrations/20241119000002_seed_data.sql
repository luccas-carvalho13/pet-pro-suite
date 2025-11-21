-- ============================================
-- SEED DATA - Dados de Exemplo para o Sistema
-- ============================================
-- Este arquivo contém dados de exemplo para popular o banco de dados
-- Execute após executar as migrações principais

-- ============================================
-- PLANS (Planos)
-- ============================================
INSERT INTO plans (name, description, price, trial_days, features, is_active) VALUES
('Trial', 'Plano de teste gratuito', 0.00, 14, '["Acesso básico", "Suporte por email"]'::jsonb, true),
('Basic', 'Plano básico para pequenas clínicas', 99.00, 0, '["Até 5 usuários", "Clientes e pets ilimitados", "Agendamentos", "Relatórios básicos"]'::jsonb, true),
('Pro', 'Plano profissional', 299.00, 0, '["Até 15 usuários", "Todos os recursos", "Suporte prioritário", "API access"]'::jsonb, true),
('Business', 'Plano empresarial', 599.00, 0, '["Usuários ilimitados", "Recursos avançados", "Suporte 24/7", "Onboarding dedicado"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TENANTS (Empresas/Clínicas)
-- ============================================
-- Senha padrão: "123456" (hash bcrypt)
-- Em produção, use um hash real gerado pelo sistema
INSERT INTO tenants (id, name, slug, cnpj, email, phone, address, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'PetCare Clínica Veterinária', 'petcare-clinica', '12.345.678/0001-90', 'contato@petcare.com', '(11) 3456-7890', '{"street": "Rua das Flores, 123", "city": "São Paulo", "state": "SP", "zip": "01234-567"}'::jsonb, true),
('00000000-0000-0000-0000-000000000002', 'VetClinic São Paulo', 'vetclinic-sp', '98.765.432/0001-10', 'contato@vetclinic.com', '(11) 9876-5432', '{"street": "Av. Paulista, 1000", "city": "São Paulo", "state": "SP", "zip": "01310-100"}'::jsonb, true),
('00000000-0000-0000-0000-000000000003', 'Petshop Amor Animal', 'petshop-amor', '11.222.333/0001-44', 'contato@amoranimal.com', '(11) 2345-6789', '{"street": "Rua dos Animais, 456", "city": "São Paulo", "state": "SP", "zip": "04567-890"}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUBSCRIPTIONS (Assinaturas)
-- ============================================
INSERT INTO subscriptions (tenant_id, plan_id, status, trial_ends_at, current_period_start, current_period_end) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM plans WHERE name = 'Profissional'), 'active', NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM plans WHERE name = 'Empresarial'), 'active', NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
('00000000-0000-0000-0000-000000000003', (SELECT id FROM plans WHERE name = 'Trial'), 'trial', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- USERS (Usuários)
-- ============================================
-- Senha padrão: "123456" (em produção, use hash bcrypt real)
-- Hash bcrypt de "123456": $2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
INSERT INTO users (id, name, email, password, phone, role, tenant_id, is_active, is_email_verified) VALUES
-- Super Admin (sem tenant_id)
('11111111-1111-1111-1111-111111111111', 'Super Admin', 'admin@petpro.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 9999-9999', 'super_admin', NULL, true, true),
-- PetCare Clínica
('22222222-2222-2222-2222-222222222221', 'João Silva', 'joao@petcare.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 98765-4321', 'admin', '00000000-0000-0000-0000-000000000001', true, true),
('22222222-2222-2222-2222-222222222222', 'Maria Santos', 'maria@petcare.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 91234-5678', 'veterinarian', '00000000-0000-0000-0000-000000000001', true, true),
('22222222-2222-2222-2222-222222222223', 'Carlos Lima', 'carlos@petcare.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 97654-3210', 'attendant', '00000000-0000-0000-0000-000000000001', true, true),
-- VetClinic São Paulo
('33333333-3333-3333-3333-333333333331', 'Ana Costa', 'ana@vetclinic.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 99876-5432', 'admin', '00000000-0000-0000-0000-000000000002', true, true),
('33333333-3333-3333-3333-333333333332', 'Paulo Oliveira', 'paulo@vetclinic.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 92345-6789', 'veterinarian', '00000000-0000-0000-0000-000000000002', true, true),
-- Petshop Amor Animal
('44444444-4444-4444-4444-444444444441', 'Pedro Alves', 'pedro@amoranimal.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '(11) 93456-7890', 'admin', '00000000-0000-0000-0000-000000000003', true, true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- CLIENTS (Clientes)
-- ============================================
INSERT INTO clients (id, name, email, phone, cpf, address, tenant_id, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Maria Silva', 'maria.silva@email.com', '(11) 98765-4321', '123.456.789-00', '{"street": "Rua A, 100", "city": "São Paulo", "state": "SP", "zip": "01234-567"}'::jsonb, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'João Santos', 'joao.santos@email.com', '(11) 91234-5678', '234.567.890-11', '{"street": "Rua B, 200", "city": "São Paulo", "state": "SP", "zip": "02345-678"}'::jsonb, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Ana Costa', 'ana.costa@email.com', '(11) 99876-5432', '345.678.901-22', '{"street": "Rua C, 300", "city": "São Paulo", "state": "SP", "zip": "03456-789"}'::jsonb, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Carlos Lima', 'carlos.lima@email.com', '(11) 97654-3210', '456.789.012-33', '{"street": "Rua D, 400", "city": "São Paulo", "state": "SP", "zip": "04567-890"}'::jsonb, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Paula Santos', 'paula.santos@email.com', '(11) 94567-8901', '567.890.123-44', '{"street": "Rua E, 500", "city": "São Paulo", "state": "SP", "zip": "05678-901"}'::jsonb, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- PETS (Pets)
-- ============================================
INSERT INTO pets (id, name, species, breed, gender, birth_date, weight, color, client_id, tenant_id, created_by) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Rex', 'dog', 'Golden Retriever', 'male', '2021-01-15', 25.5, 'Dourado', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Mimi', 'cat', 'Persa', 'female', '2022-03-20', 4.2, 'Branco', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Bob', 'dog', 'Labrador', 'male', '2020-05-10', 30.0, 'Preto', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'Luna', 'dog', 'Pastor Alemão', 'female', '2019-08-25', 28.0, 'Preto e Marrom', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'Thor', 'dog', 'Bulldog', 'male', '2021-11-12', 22.0, 'Branco e Marrom', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'Bolinha', 'cat', 'Siamês', 'female', '2023-02-14', 3.5, 'Bege e Marrom', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- SERVICES (Serviços)
-- ============================================
INSERT INTO services (id, name, description, category, duration, price, commission, tenant_id, created_by) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Consulta Veterinária', 'Consulta de rotina com veterinário', 'veterinary', 30, 150.00, 40.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Banho e Tosa Pequeno Porte', 'Banho e tosa para animais de pequeno porte', 'grooming', 60, 80.00, 50.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Banho e Tosa Grande Porte', 'Banho e tosa para animais de grande porte', 'grooming', 90, 120.00, 50.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'Vacinação V10', 'Vacina V10 para cães', 'veterinary', 15, 90.00, 30.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Tosa Higiênica', 'Tosa higiênica completa', 'grooming', 30, 50.00, 50.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'Cirurgia Castração', 'Cirurgia de castração', 'veterinary', 120, 600.00, 35.00, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- APPOINTMENTS (Agendamentos)
-- ============================================
INSERT INTO appointments (id, date, start_time, end_time, service_id, pet_id, client_id, veterinarian_id, status, price, payment_status, tenant_id, created_by) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddd1', CURRENT_DATE, '09:00', '09:30', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'confirmed', 150.00, 'paid', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('dddddddd-dddd-dddd-dddd-ddddddddddd2', CURRENT_DATE, '10:00', '10:15', 'cccccccc-cccc-cccc-cccc-ccccccccccc4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'confirmed', 90.00, 'paid', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('dddddddd-dddd-dddd-dddd-ddddddddddd3', CURRENT_DATE, '11:00', '11:45', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222222', 'in_progress', 80.00, 'pending', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('dddddddd-dddd-dddd-dddd-ddddddddddd4', CURRENT_DATE, '14:00', '14:30', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '22222222-2222-2222-2222-222222222222', 'scheduled', 150.00, 'pending', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('dddddddd-dddd-dddd-dddd-ddddddddddd5', CURRENT_DATE + INTERVAL '1 day', '09:00', '09:30', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '22222222-2222-2222-2222-222222222222', 'scheduled', 150.00, 'pending', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- PRODUCTS (Produtos)
-- ============================================
INSERT INTO products (id, name, description, sku, category, unit, cost_price, sale_price, stock, min_stock, max_stock, tenant_id, created_by) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Ração Premium Cães 15kg', 'Ração premium para cães adultos', 'RACAO-CAO-15KG', 'food', 'kg', 100.00, 159.90, 45, 20, 100, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'Ração Premium Gatos 10kg', 'Ração premium para gatos adultos', 'RACAO-GATO-10KG', 'food', 'kg', 90.00, 139.90, 15, 20, 80, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'Shampoo Antipulgas', 'Shampoo para eliminação de pulgas', 'SHAMPOO-ANTI', 'hygiene', 'ml', 25.00, 45.90, 8, 15, 50, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'Coleira Ajustável', 'Coleira ajustável para cães e gatos', 'COLEIRA-AJUST', 'accessory', 'unit', 15.00, 29.90, 30, 10, 100, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'Vacina Antirrábica', 'Vacina antirrábica para cães e gatos', 'VACINA-RABICA', 'medicine', 'unit', 50.00, 85.00, 50, 25, 200, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', 'Areia Sanitária 10kg', 'Areia sanitária aglomerante', 'AREIA-10KG', 'hygiene', 'kg', 20.00, 34.90, 12, 20, 100, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- FINANCIAL TRANSACTIONS (Transações Financeiras)
-- ============================================
INSERT INTO financial_transactions (id, type, category, description, amount, payment_method, date, appointment_id, tenant_id, created_by) VALUES
-- Receitas
('ffffffff-ffff-ffff-ffff-fffffffffff1', 'income', 'serviço', 'Consulta - Rex (Golden Retriever)', 150.00, 'pix', CURRENT_DATE, 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff2', 'income', 'serviço', 'Banho e Tosa - Luna (Pastor Alemão)', 80.00, 'credit_card', CURRENT_DATE, 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff3', 'income', 'produto', 'Ração Premium 15kg', 159.90, 'pix', CURRENT_DATE, NULL, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff4', 'income', 'serviço', 'Vacinação V10 - Thor (Bulldog)', 90.00, 'cash', CURRENT_DATE, 'dddddddd-dddd-dddd-dddd-ddddddddddd2', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
-- Despesas
('ffffffff-ffff-ffff-ffff-fffffffffff5', 'expense', 'compras', 'Fornecedor - Ração Pet Food', 2500.00, 'bank_transfer', CURRENT_DATE - INTERVAL '5 days', NULL, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff6', 'expense', 'operacional', 'Energia Elétrica', 450.00, 'bank_transfer', CURRENT_DATE - INTERVAL '3 days', NULL, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff7', 'expense', 'compras', 'Medicamentos Diversos', 890.00, 'credit_card', CURRENT_DATE - INTERVAL '1 day', NULL, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('ffffffff-ffff-ffff-ffff-fffffffffff8', 'expense', 'pessoal', 'Salários', 8500.00, 'bank_transfer', CURRENT_DATE - INTERVAL '1 day', NULL, '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- STOCK MOVEMENTS (Movimentações de Estoque)
-- ============================================
INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost, reason, tenant_id, created_by) VALUES
('gggggggg-gggg-gggg-gggg-ggggggggggg1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'entry', 50, 100.00, 'Compra de fornecedor', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('gggggggg-gggg-gggg-gggg-ggggggggggg2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'exit', 5, 100.00, 'Venda', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('gggggggg-gggg-gggg-gggg-ggggggggggg3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'entry', 30, 90.00, 'Compra de fornecedor', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221'),
('gggggggg-gggg-gggg-gggg-ggggggggggg4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'exit', 15, 90.00, 'Venda', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221')
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. As senhas estão usando um hash de exemplo. Em produção, use bcrypt real
-- 2. Os UUIDs são fixos para facilitar testes, mas podem ser gerados automaticamente
-- 3. Ajuste as datas conforme necessário para seus testes
-- 4. Os valores monetários estão em R$ (Reais)
-- 5. Execute este script após as migrações principais

