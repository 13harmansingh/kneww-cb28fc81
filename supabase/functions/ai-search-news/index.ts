import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
            content: `You are a news search query parser. Extract key search terms, locations, topics, and entities from user queries.
Return a JSON object with:
- searchText: main keywords to search (required)
- locations: array of countries/states/cities mentioned
- categories: array of categories (politics, business, technology, sports, entertainment, health, science)
- timeframe: recent/today/this_week if mentioned

Example:
User: "trump buying canada"
Response: {"searchText":"Trump Canada acquisition","locations":["Canada","US"],"categories":["politics","business"],"timeframe":"recent"}

User: "latest tech news from japan"
Response: {"searchText":"technology news","locations":["Japan"],"categories":["technology"],"timeframe":"recent"}`
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
