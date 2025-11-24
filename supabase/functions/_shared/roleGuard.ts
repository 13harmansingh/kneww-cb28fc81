import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { AuthResult } from './auth.ts';
import { logEvent, TelemetryEvents } from './telemetry.ts';

export type AppRole = 'admin' | 'user' | 'editor';

export async function requireRole(
  supabaseClient: any,
  userId: string,
  requiredRole: AppRole
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data || data.role !== requiredRole) {
    return `Required role: ${requiredRole}`;
  }

  return null;
}

export async function requireAdmin(authResult: AuthResult, endpoint: string): Promise<boolean> {
  if (!authResult.user) {
    await logEvent({
      eventType: TelemetryEvents.AUTH_FAILURE,
      userId: undefined,
      endpoint,
      metadata: { reason: 'No authenticated user', requirement: 'admin' }
    });
    return false;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authResult.user.id)
    .single();

  if (error || !data || data.role !== 'admin') {
    await logEvent({
      eventType: 'auth.fail.role',
      userId: authResult.user.id,
      endpoint,
      metadata: { role: data?.role || 'none', required: 'admin' }
    });
    return false;
  }

  return true;
}
