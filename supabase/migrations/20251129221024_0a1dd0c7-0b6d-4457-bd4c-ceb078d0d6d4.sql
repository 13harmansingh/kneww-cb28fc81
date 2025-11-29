-- Create access_requests table for invite-only platform
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can request access (public form submission)
CREATE POLICY "Anyone can request access"
  ON public.access_requests
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view access requests
CREATE POLICY "Admins can view all requests"
  ON public.access_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update access requests
CREATE POLICY "Admins can update requests"
  ON public.access_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete access requests
CREATE POLICY "Admins can delete requests"
  ON public.access_requests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));