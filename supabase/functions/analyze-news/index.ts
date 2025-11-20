import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';
import { getCachedAnalysis, setCachedAnalysis } from '../_shared/cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeNewsRequest {
  title: string;
  text: string;
  url: string;
}

function validateInput(data: any): data is AnalyzeNewsRequest {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  if (typeof data.title !== 'string' || data.title.length === 0 || data.title.length > 500) {
    return false;
  }
  
  if (typeof data.text !== 'string' || data.text.length > 50000) {
    return false;
  }
  
  if (typeof data.url !== 'string' || data.url.length === 0 || data.url.length > 2000) {
    return false;
  }
  
  // Basic URL validation
  try {
    new URL(data.url);
  } catch {
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
        endpoint: 'analyze-news',
        metadata: { ip: clientIP, error: authError },
      });

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'analyze-news');
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'analyze-news',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        bias: 'Unknown',
        summary: 'Analysis unavailable due to rate limit',
        ownership: 'Unknown',
        sentiment: 'neutral',
        claims: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate input
    const requestData = await req.json();
    if (!validateInput(requestData)) {
      return new Response(JSON.stringify({ error: 'Invalid input parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, text, url } = requestData;

    // Check cache first
    const cachedAnalysis = await getCachedAnalysis(url);
    if (cachedAnalysis) {
      console.log(`[${user.id}] Cache HIT for article:`, title);
      
      await logEvent({
        eventType: TelemetryEvents.CACHE_HIT,
        userId: user.id,
        endpoint: 'analyze-news',
        metadata: { url, duration: Date.now() - startTime },
      });

      return new Response(
        JSON.stringify(cachedAnalysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Cache MISS - analyzing article:`, title);
    
    await logEvent({
      eventType: TelemetryEvents.CACHE_MISS,
      userId: user.id,
      endpoint: 'analyze-news',
      metadata: { url },
    });
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing news article for user:', user.id, 'title:', title);

    const systemPrompt = `You are a news analysis expert. Analyze the given news article and provide:
1. Political Bias (Left, Center-Left, Center, Center-Right, Right, or Unknown)
2. A concise 2-sentence summary
3. Media ownership information (if identifiable from the URL/source)
4. Sentiment analysis (positive, negative, or neutral)
5. Extract up to 3 key factual claims and verify them (verified, disputed, or unverified)

Respond in JSON format only:
{
  "bias": "string",
  "summary": "string",
  "ownership": "string",
  "sentiment": "positive" | "negative" | "neutral",
  "claims": [
    {
      "text": "claim text",
      "verification": "verified" | "disputed" | "unverified",
      "explanation": "brief explanation of verification status"
    }
  ]
}`;

    const userPrompt = `Article Title: ${title}\nArticle URL: ${url}\nArticle Text: ${text?.substring(0, 1000) || 'No content available'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          bias: 'Unknown',
          summary: text?.substring(0, 200) || 'No summary available',
          ownership: 'Unknown',
          sentiment: 'neutral',
          claims: []
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add funds.',
          bias: 'Unknown',
          summary: text?.substring(0, 200) || 'No summary available',
          ownership: 'Unknown',
          sentiment: 'neutral',
          claims: []
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    if (content.includes('```')) {
      content = content.split('```json').join('').split('```').join('').trim();
    }
    
    const analysis = JSON.parse(content);
    
    const duration = Date.now() - startTime;
    console.log(`[${user.id}] Analysis complete:`, analysis);

    // Cache the analysis for future requests
    await setCachedAnalysis(url, analysis);

    // Log telemetry
    await logEvent({
      eventType: TelemetryEvents.AI_ANALYSIS,
      userId: user.id,
      endpoint: 'analyze-news',
      metadata: {
        url,
        duration,
        tokensUsed: data.usage?.total_tokens || 0,
        claimsCount: analysis.claims?.length || 0,
      },
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-news function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await logEvent({
      eventType: 'error.unhandled',
      endpoint: 'analyze-news',
      metadata: { error: errorMessage },
    });

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        bias: 'Unknown',
        summary: 'Analysis unavailable',
        ownership: 'Unknown',
        sentiment: 'neutral',
        claims: []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});