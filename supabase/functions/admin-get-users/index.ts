import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { requireRole } from '../_shared/roleGuard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'admin-get-users');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const roleError = await requireRole(supabaseClient, user.id, 'admin');
    if (roleError) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to get user details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get profiles and roles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, banned, created_at');

    if (profilesError) throw profilesError;

    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

    // Get user emails from auth
    const usersWithDetails = [];
    for (const profile of profilesData || []) {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      const roleData = rolesData?.find((r) => r.user_id === profile.id);

      usersWithDetails.push({
        id: profile.id,
        email: authData?.user?.email || 'Unknown',
        display_name: profile.display_name,
        role: roleData?.role || 'user',
        banned: profile.banned || false,
        created_at: profile.created_at,
      });
    }

    return new Response(
      JSON.stringify({ users: usersWithDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-get-users:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
