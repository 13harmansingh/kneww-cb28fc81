-- Add principal_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS principal_language text DEFAULT 'en';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_principal_language ON public.profiles(principal_language);