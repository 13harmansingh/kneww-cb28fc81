import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface TelemetryEvent {
  eventType: string;
  userId?: string;
  endpoint: string;
  metadata?: Record<string, any>;
}

export async function logEvent(event: TelemetryEvent): Promise<void> {
  try {
    // Log to console in all environments
    console.log(`[TELEMETRY] ${event.eventType}:`, {
      endpoint: event.endpoint,
      userId: event.userId,
      ...event.metadata,
    });

    // Also persist to database for production analysis
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabase.from('telemetry_logs').insert({
      event_type: event.eventType,
      user_id: event.userId,
      endpoint: event.endpoint,
      metadata: event.metadata || {},
    });
  } catch (error) {
    console.error('[TELEMETRY ERROR]', error);
    // Don't throw - telemetry failures shouldn't break the main flow
  }
}

// Pre-defined event types
export const TelemetryEvents = {
  API_CALL: 'api.call',
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  RATE_LIMIT: 'rate_limit.exceeded',
  AUTH_FAILURE: 'auth.failure',
  EXTERNAL_API_ERROR: 'external_api.error',
  AI_ANALYSIS: 'ai.analysis',
  AI_SEARCH: 'ai.search',
  AI_TRANSLATE: 'ai.translate',
} as const;
