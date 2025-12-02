-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Reset all existing users to see the onboarding (treat as first-time)
UPDATE public.profiles SET onboarding_completed = false;