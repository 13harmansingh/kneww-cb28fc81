-- Fix AI analysis cache RLS to prevent cache poisoning
DROP POLICY IF EXISTS "Authenticated users can insert analysis cache" ON public.ai_analysis_cache;

CREATE POLICY "Service role can insert analysis cache"
ON public.ai_analysis_cache
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix telemetry logs RLS to prevent log injection
DROP POLICY IF EXISTS "Service can insert telemetry logs" ON public.telemetry_logs;

CREATE POLICY "Service role can insert telemetry logs"
ON public.telemetry_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add more restrictive profiles policy for sensitive data
CREATE POLICY "Users can only view their own sensitive data"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
