import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        endpoint: 'ai-search-news',
        metadata: { ip: clientIP, error: authError },
      });

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'ai-search-news');
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'ai-search-news',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, language = 'en' } = await req.json();

    if (!query || typeof query !== 'string' || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('AI Search query:', query, 'Language:', language);

    // Use AI to extract search parameters from natural language
    // Focus on entities, topics, and keywords - NOT location unless explicitly mentioned
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a news search query parser. Extract entities, topics, and keywords from user queries to search worldwide news.

IMPORTANT: Do NOT add locations unless the user explicitly mentions them. The search is global by default.

Return a JSON object with:
- searchText: main entities, topics, and keywords to search (required) - focus on WHAT not WHERE
- entities: array of people, organizations, events mentioned
- categories: array of categories (politics, business, technology, sports, entertainment, health, science)
- timeframe: recent/today/this_week if mentioned
- locations: ONLY include if explicitly mentioned by user

Examples:
User: "trump"
Response: {"searchText":"Donald Trump","entities":["Donald Trump"],"categories":["politics"],"timeframe":"recent","locations":[]}

User: "elon musk"
Response: {"searchText":"Elon Musk","entities":["Elon Musk"],"categories":["business","technology"],"timeframe":"recent","locations":[]}

User: "tesla spacex"
Response: {"searchText":"Tesla SpaceX","entities":["Tesla","SpaceX","Elon Musk"],"categories":["business","technology"],"timeframe":"recent","locations":[]}

User: "trump buying canada"
Response: {"searchText":"Trump Canada acquisition","entities":["Donald Trump","Canada"],"categories":["politics","business"],"timeframe":"recent","locations":[]}

User: "ai technology breakthroughs"
Response: {"searchText":"artificial intelligence breakthroughs","entities":["AI","artificial intelligence"],"categories":["technology","science"],"timeframe":"recent","locations":[]}

User: "sports news from india"
Response: {"searchText":"sports news","entities":[],"categories":["sports"],"locations":["India"],"timeframe":"recent"}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback: use query as-is
      return new Response(
        JSON.stringify({
          searchText: query,
          locations: [],
          categories: [],
          language
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    let parsedQuery;
    try {
      parsedQuery = JSON.parse(content);
    } catch {
      // If AI response isn't valid JSON, fallback
      parsedQuery = {
        searchText: query,
        locations: [],
        categories: []
      };
    }

    console.log('Parsed query:', parsedQuery);

    return new Response(
      JSON.stringify({
        ...parsedQuery,
        language,
        originalQuery: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-news:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
