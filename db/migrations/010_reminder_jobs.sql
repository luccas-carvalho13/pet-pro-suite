CREATE TABLE IF NOT EXISTS public.reminder_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL DEFAULT 'appointment',
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reminder_jobs_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  CONSTRAINT reminder_jobs_channel_check CHECK (channel IN ('whatsapp', 'email', 'sms'))
);

CREATE INDEX IF NOT EXISTS idx_reminder_jobs_company_status_scheduled
  ON public.reminder_jobs (company_id, status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_reminder_jobs_company_type
  ON public.reminder_jobs (company_id, reminder_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_jobs_unique_appointment_reminder
  ON public.reminder_jobs (appointment_id, reminder_type)
  WHERE appointment_id IS NOT NULL AND status IN ('pending', 'sent');

DROP TRIGGER IF EXISTS update_reminder_jobs_updated_at ON public.reminder_jobs;
CREATE TRIGGER update_reminder_jobs_updated_at
  BEFORE UPDATE ON public.reminder_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
