-- Fix 1: Remove the overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Users can view all profile data except emails" ON public.profiles;

-- Fix 2: Enable FORCE ROW LEVEL SECURITY on access_requests to prevent any bypass
ALTER TABLE public.access_requests FORCE ROW LEVEL SECURITY;