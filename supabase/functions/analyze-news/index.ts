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
    const { title, text, url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing news article:', title);

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
    
    console.log('Analysis complete:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-news function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
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
