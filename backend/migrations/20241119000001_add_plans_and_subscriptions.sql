-- ============================================
-- Adicionar tabelas de Planos e Assinaturas
-- ============================================

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    trial_days INTEGER DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    max_users INTEGER,
    max_pets INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_is_trial ON plans(is_trial);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'trial'
        CHECK (status IN ('trial', 'active', 'suspended', 'past_due', 'cancelled')),
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);

-- Tabela de Permissões por Role
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL
        CHECK (role IN ('admin', 'supervisor', 'attendant', 'user')),
    module VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role, module)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_role ON role_permissions(tenant_id, role);

-- Atualizar tabela tenants para incluir campos de status
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'past_due', 'cancelled')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES plans(id);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON tenants(trial_ends_at);

-- Atualizar tabela users para incluir campo de permissões customizadas
ALTER TABLE users
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir planos padrão
INSERT INTO plans (id, name, description, price, trial_days, is_trial, features, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Trial', 'Plano de teste grátis por 14 dias', 0, 14, true, 
     '{"users": 5, "pets": 50, "appointments": true, "financial": true, "reports": false}'::jsonb, true),
    ('00000000-0000-0000-0000-000000000002', 'Básico', 'Plano básico para clínicas pequenas', 99.00, 0, false,
     '{"users": 3, "pets": 100, "appointments": true, "financial": true, "reports": true}'::jsonb, true),
    ('00000000-0000-0000-0000-000000000003', 'Profissional', 'Plano profissional para clínicas médias', 299.00, 0, false,
     '{"users": 10, "pets": 500, "appointments": true, "financial": true, "reports": true, "inventory": true}'::jsonb, true),
    ('00000000-0000-0000-0000-000000000004', 'Empresarial', 'Plano empresarial para grandes clínicas', 599.00, 0, false,
     '{"users": -1, "pets": -1, "appointments": true, "financial": true, "reports": true, "inventory": true, "api": true}'::jsonb, true)
ON CONFLICT DO NOTHING;

