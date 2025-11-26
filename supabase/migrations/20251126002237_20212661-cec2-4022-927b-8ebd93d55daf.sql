-- Create user_follows table for personalized feed
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_type text NOT NULL CHECK (follow_type IN ('state', 'topic')),
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, follow_type, value)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own follows
CREATE POLICY "Users can view their own follows" ON public.user_follows
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follows" ON public.user_follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.user_follows
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);