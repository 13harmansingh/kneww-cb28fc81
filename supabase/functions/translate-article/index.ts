import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  title: string;
  text?: string;
  summary?: string;
  bias?: string;
  ownership?: string;
  targetLanguage: string;
}

function validateInput(data: any): data is TranslateRequest {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  if (typeof data.title !== 'string' || data.title.length === 0) {
    return false;
  }
  
  if (typeof data.targetLanguage !== 'string' || data.targetLanguage.length === 0) {
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
        endpoint: 'translate-article',
        metadata: { ip: clientIP, error: authError },
      });

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'translate-article');
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'translate-article',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    if (!validateInput(requestData)) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, text, summary, bias, ownership, targetLanguage } = requestData;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'pt': 'Portuguese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'ru': 'Russian',
      'it': 'Italian',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const contentToTranslate = {
      title,
      ...(text && { text }),
      ...(summary && { summary }),
      ...(bias && { bias }),
      ...(ownership && { ownership }),
    };

    const prompt = `Translate the following news article content to ${targetLangName}. 
Maintain the original meaning and tone. Return ONLY valid JSON with the same structure, translating the values.

Content to translate:
${JSON.stringify(contentToTranslate, null, 2)}

Return format:
{
  "title": "translated title",
  ${text ? '"text": "translated text",' : ''}
  ${summary ? '"summary": "translated summary",' : ''}
  ${bias ? '"bias": "translated bias",' : ''}
  ${ownership ? '"ownership": "translated ownership"' : ''}
}`;

    console.log('Translating to:', targetLangName, 'for user:', user.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. You translate news articles accurately while preserving meaning and tone. Always return valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      throw new Error('Translation failed');
    }

    const data = await response.json();
    const translatedContent = data.choices[0].message.content;

    let parsedTranslation;
    try {
      const cleanedContent = translatedContent.replace(/```json\n?|\n?```/g, '').trim();
      parsedTranslation = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing translation:', parseError);
      throw new Error('Failed to parse translation');
    }

    console.log('Translation successful');
    return new Response(JSON.stringify(parsedTranslation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in translate-article function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
