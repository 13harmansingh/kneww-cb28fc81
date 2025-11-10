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
    const { state, category } = await req.json();
    const WORLDNEWS_API_KEY = Deno.env.get('WORLDNEWS_API_KEY');

    if (!WORLDNEWS_API_KEY) {
      throw new Error('WORLDNEWS_API_KEY not configured');
    }

    console.log('Fetching news for state:', state, 'category:', category);

    // Build the API URL with parameters
    const params = new URLSearchParams({
      'api-key': WORLDNEWS_API_KEY,
      'source-countries': 'us',
      'language': 'en',
      'number': '10',
    });

    // Build search text combining state and category
    const searchTerms = [];
    if (state && state !== 'all') {
      searchTerms.push(state);
    }
    if (category && category !== 'all') {
      searchTerms.push(category);
    }
    
    if (searchTerms.length > 0) {
      params.append('text', searchTerms.join(' '));
    }

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
    console.log('Successfully fetched', data.news?.length || 0, 'articles');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
