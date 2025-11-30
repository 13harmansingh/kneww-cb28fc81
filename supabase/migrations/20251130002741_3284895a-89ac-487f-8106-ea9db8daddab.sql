-- Create daily_newspaper table
CREATE TABLE public.daily_newspaper (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  articles jsonb NOT NULL DEFAULT '[]',
  generated_date date NOT NULL DEFAULT CURRENT_DATE,
  generation_status text DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'complete', 'failed')),
  generation_progress jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, generated_date)
);

-- Enable RLS
ALTER TABLE public.daily_newspaper ENABLE ROW LEVEL SECURITY;

-- Users can view their own newspaper
CREATE POLICY "Users can view own newspaper"
  ON public.daily_newspaper
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own newspaper
CREATE POLICY "Users can insert own newspaper"
  ON public.daily_newspaper
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own newspaper
CREATE POLICY "Users can update own newspaper"
  ON public.daily_newspaper
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all newspapers for background processing
CREATE POLICY "Service role can manage newspapers"
  ON public.daily_newspaper
  FOR ALL
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_daily_newspaper_user_date ON public.daily_newspaper(user_id, generated_date);

-- Trigger to update updated_at
CREATE TRIGGER update_daily_newspaper_updated_at
  BEFORE UPDATE ON public.daily_newspaper
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();