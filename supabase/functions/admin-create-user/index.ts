import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateAuth } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { requireRole } from '../_shared/roleGuard.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'user' | 'editor';
  request_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'admin-create-user');
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
      await logEvent({
        eventType: TelemetryEvents.AUTH_FAILURE,
        userId: user.id,
        endpoint: 'admin-create-user',
        metadata: { reason: 'Admin role required' }
      });
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, full_name, role = 'user', request_id }: CreateUserRequest = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Email, password, and full_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to create user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user in auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: full_name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      await logEvent({
        eventType: 'admin.user.create.error',
        userId: user.id,
        endpoint: 'admin-create-user',
        metadata: { error: createError.message, email }
      });
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile entry (this may be handled by trigger, but we ensure it exists)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: newUserId, display_name: full_name });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Create user role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role });

    if (roleInsertError) {
      console.error('Error creating user role:', roleInsertError);
    }

    // If this was from an access request, update the request status
    if (request_id) {
      await supabaseAdmin
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request_id);
    }

    // Send notification to new user
    await supabaseAdmin.rpc('send_notification', {
      _user_id: newUserId,
      _title: 'Welcome to KNEW',
      _description: 'Your access has been granted. Welcome to global intelligence.',
      _type: 'access_granted',
    });

    await logEvent({
      eventType: 'admin.user.created',
      userId: user.id,
      endpoint: 'admin-create-user',
      metadata: { new_user_id: newUserId, email, role }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        email 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-create-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
