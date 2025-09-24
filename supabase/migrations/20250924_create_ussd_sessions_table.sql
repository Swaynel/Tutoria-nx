-- Migration: create_ussd_sessions_table.sql
-- Purpose: store USSD session logs for debugging and analytics

CREATE TABLE IF NOT EXISTS public.ussd_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  phone text NOT NULL,
  service_code text,
  input_text text,
  response_text text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups by phone and session
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_phone ON public.ussd_sessions (phone);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_session_id ON public.ussd_sessions (session_id);

-- End of migration
