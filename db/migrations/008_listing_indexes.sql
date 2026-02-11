-- Índices para listagens paginadas e filtros por busca/status

CREATE INDEX IF NOT EXISTS idx_clients_company_name
  ON public.clients (company_id, name);

CREATE INDEX IF NOT EXISTS idx_clients_company_email
  ON public.clients (company_id, email);

CREATE INDEX IF NOT EXISTS idx_pets_company_name
  ON public.pets (company_id, name);

CREATE INDEX IF NOT EXISTS idx_services_company_name
  ON public.services (company_id, name);

CREATE INDEX IF NOT EXISTS idx_products_company_name
  ON public.products (company_id, name);

CREATE INDEX IF NOT EXISTS idx_appointments_company_scheduled_at
  ON public.appointments (company_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_company_status
  ON public.appointments (company_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_company_date_type
  ON public.transactions (company_id, date DESC, type);

CREATE INDEX IF NOT EXISTS idx_companies_name
  ON public.companies (name);
