import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchRelatedNewsRequest {
  topic: string;
  language?: string;
  source_country?: string;
}

function validateInput(data: any): data is FetchRelatedNewsRequest {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  if (typeof data.topic !== 'string' || data.topic.length === 0) {
    return false;
  }
  
  if (data.topic.length > 200) {
    return false;
  }
  
  if (data.language !== undefined && typeof data.language !== 'string') {
    return false;
  }
  
  if (data.source_country !== undefined && typeof data.source_country !== 'string') {
    return false;
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIP = getClientIP(req);

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      await logEvent({
        eventType: TelemetryEvents.AUTH_FAILURE,
        endpoint: 'fetch-related-news',
        metadata: { ip: clientIP, error: authError },
      });

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'fetch-related-news');
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'fetch-related-news',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    if (!validateInput(requestData)) {
      return new Response(JSON.stringify({ error: 'Invalid input parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, language = 'en', source_country = 'us' } = requestData;
    const WORLDNEWS_API_KEY = Deno.env.get('WORLDNEWS_API_KEY');

    if (!WORLDNEWS_API_KEY) {
      throw new Error('WORLDNEWS_API_KEY not configured');
    }

    console.log('Fetching related news for user:', user.id, 'topic:', topic, 'language:', language);

    const params = new URLSearchParams({
      'api-key': WORLDNEWS_API_KEY,
      'text': topic,
      'language': language,
      'source-countries': source_country.toLowerCase(),
      'number': '20',
      'sort': 'publish-time',
      'sort-direction': 'DESC',
    });

    const url = `https://api.worldnewsapi.com/search-news?${params.toString()}`;
    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WorldNews API error:', response.status, errorText);
      throw new Error(`WorldNews API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched', data.news?.length || 0, 'related articles');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-related-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
