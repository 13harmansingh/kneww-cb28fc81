-- Create app_settings table for global configuration
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1,
  previous_value jsonb
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage app_settings
CREATE POLICY "Admins can manage app_settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create system_events table for realtime event logging
CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  data jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Admins can view system_events
CREATE POLICY "Admins can view system_events" ON public.system_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert system_events
CREATE POLICY "Service can insert system_events" ON public.system_events
  FOR INSERT WITH CHECK (true);

-- Enable realtime for system_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('news_refresh_interval', '300000', 'News refresh interval in milliseconds (default: 5 minutes)'),
  ('enable_ai_analysis', 'true', 'Enable AI analysis for articles'),
  ('enable_world_map', 'true', 'Enable interactive world map'),
  ('global_banner_message', 'null', 'Global banner message shown to all users'),
  ('maintenance_mode', 'false', 'Enable maintenance mode (blocks all users)');