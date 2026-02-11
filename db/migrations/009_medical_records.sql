CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(6,2),
  temperature_c DECIMAL(4,1),
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_company_pet_date
  ON public.medical_records (company_id, pet_id, record_date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_company_date
  ON public.medical_records (company_id, record_date DESC);

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
