ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_company_reference
  ON public.transactions (company_id, reference_type, reference_id);

CREATE TABLE IF NOT EXISTS public.cash_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cash_entries_type_check CHECK (entry_type IN ('inflow', 'outflow')),
  CONSTRAINT cash_entries_amount_check CHECK (amount > 0),
  CONSTRAINT cash_entries_method_check CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_cash_entries_company_occurred
  ON public.cash_entries (company_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_entries_company_type
  ON public.cash_entries (company_id, entry_type);

DROP TRIGGER IF EXISTS update_cash_entries_updated_at ON public.cash_entries;
CREATE TRIGGER update_cash_entries_updated_at
  BEFORE UPDATE ON public.cash_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
