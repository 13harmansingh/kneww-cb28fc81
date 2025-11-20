-- Create AI analysis cache table
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_hash text NOT NULL,
  article_url text NOT NULL,
  model_version text NOT NULL DEFAULT 'gemini_2.5_flash_v1',
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(article_hash, model_version)
);

-- Create index for fast lookups
CREATE INDEX idx_ai_analysis_cache_hash ON public.ai_analysis_cache(article_hash);
CREATE INDEX idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cache (public data)
CREATE POLICY "Anyone can read ai analysis cache"
ON public.ai_analysis_cache
FOR SELECT
USING (true);

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert analysis cache"
ON public.ai_analysis_cache
FOR INSERT
WITH CHECK (true);

-- Create telemetry logs table
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  endpoint text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for queries
CREATE INDEX idx_telemetry_logs_event_type ON public.telemetry_logs(event_type);
CREATE INDEX idx_telemetry_logs_user_id ON public.telemetry_logs(user_id);
CREATE INDEX idx_telemetry_logs_created_at ON public.telemetry_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service can insert logs
CREATE POLICY "Service can insert telemetry logs"
ON public.telemetry_logs
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own telemetry logs"
ON public.telemetry_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Auto-delete old telemetry logs (30 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.telemetry_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;