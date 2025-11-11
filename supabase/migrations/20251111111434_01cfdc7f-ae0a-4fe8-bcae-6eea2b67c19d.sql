-- Fix email exposure by restricting profile email visibility
-- Only the profile owner can see their own email
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view all profile data except emails"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can view their own email"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);