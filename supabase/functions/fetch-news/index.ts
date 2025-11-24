import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';
import { generateNewsCacheKey, getCachedNewsResponse, setCachedNewsResponse } from '../_shared/cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchNewsRequest {
  state?: string;
  category?: string;
  language?: string; // Single language code or empty for all
  source_country?: string;
  source_countries?: string; // Comma-separated for continent/multi-country
  searchText?: string; // AI search text
  entities?: string; // Comma-separated entities from AI search
}

function validateInput(data: any): data is FetchNewsRequest {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  if (data.state !== undefined && typeof data.state !== 'string') {
    return false;
  }
  
  if (data.category !== undefined && typeof data.category !== 'string') {
    return false;
  }
  
  if (data.language !== undefined && typeof data.language !== 'string') {
    return false;
  }
  
  if (data.source_country !== undefined && typeof data.source_country !== 'string') {
    return false;
  }
  
  // Validate length to prevent abuse
  if (data.state && data.state.length > 100) {
    return false;
  }
  
  if (data.category && data.category.length > 100) {
    return false;
  }
  
  if (data.language && data.language.length > 10) {
    return false;
  }
  
  if (data.source_country && data.source_country.length > 10) {
    return false;
  }
  
  if (data.source_countries && data.source_countries.length > 500) {
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
        endpoint: 'fetch-news',
        metadata: { ip: clientIP, error: authError },
      });

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'fetch-news');
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'fetch-news',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
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

    const { state, category, language, source_country = 'us', source_countries, searchText, entities } = requestData;
    const WORLDNEWS_API_KEY = Deno.env.get('WORLDNEWS_API_KEY');

    if (!WORLDNEWS_API_KEY) {
      throw new Error('WORLDNEWS_API_KEY not configured');
    }

    const textQuery = searchText || state;
    console.log('Fetching news for:', { state, category, language, source_country, source_countries, searchText, entities });

    // Generate cache key for this request
    const cacheKey = generateNewsCacheKey({
      textQuery,
      entities,
      category,
      language,
      source_country,
      source_countries,
    });

    // Check cache first
    const cachedResponse = getCachedNewsResponse(cacheKey);
    if (cachedResponse) {
      console.log('✅ Cache HIT - Returning cached news response');
      
      await logEvent({
        eventType: TelemetryEvents.CACHE_HIT,
        userId: user.id,
        endpoint: 'fetch-news',
        metadata: { 
          cacheKey,
          articleCount: cachedResponse.news?.length || 0,
        },
      });

      return new Response(JSON.stringify(cachedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('❌ Cache MISS - Fetching from WorldNews API');

    // Build the API URL with parameters
    const apiUrl = new URL('https://api.worldnewsapi.com/search-news');
    
    if (textQuery) {
      apiUrl.searchParams.append('text', textQuery);
    }
    
    // Add entities from AI search if available (only if non-empty)
    if (entities && entities.trim()) {
      apiUrl.searchParams.append('entities', entities);
    }
    
    if (category && category !== 'all') {
      apiUrl.searchParams.append('categories', category);
    }
    
    // Language filter - only one at a time, or omit for all languages
    if (language && language !== 'all') {
      apiUrl.searchParams.append('language', language);
    }
    
    // Multiple countries support for continent fetching
    if (source_countries) {
      apiUrl.searchParams.append('source-countries', source_countries);
    } else {
      apiUrl.searchParams.append('source-country', source_country);
    }
    
    apiUrl.searchParams.append('number', '50'); // Reduced from 100 to avoid rate limits
    apiUrl.searchParams.append('sort', 'publish-time');
    apiUrl.searchParams.append('sort-direction', 'DESC');

    console.log('Fetching news from:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'x-api-key': WORLDNEWS_API_KEY,
      },
    });

    // Handle rate limit gracefully - don't throw, return special response
    if (response.status === 429) {
      console.warn('WorldNews API rate limit hit (429)');
      
      await logEvent({
        eventType: TelemetryEvents.EXTERNAL_API_ERROR,
        userId: user.id,
        endpoint: 'fetch-news',
        metadata: { 
          ip: clientIP,
          external_api: 'WorldNews',
          status: 429,
          message: 'Rate limit exceeded'
        },
      });

      return new Response(
        JSON.stringify({ 
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'WorldNews API rate limit reached. Please try again in a few moments.',
          rateLimited: true,
          fallbackToCache: true
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle other non-ok responses
    if (!response.ok) {
      await logEvent({
        eventType: TelemetryEvents.EXTERNAL_API_ERROR,
        userId: user.id,
        endpoint: 'fetch-news',
        metadata: { 
          ip: clientIP,
          external_api: 'WorldNews',
          status: response.status,
          statusText: response.statusText
        },
      });
      
      throw new Error(`WorldNews API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const articles = data?.news || [];
    console.log(`Successfully fetched ${articles.length} articles`);

    // Detect available languages from response
    const languageMap = new Map<string, { name: string; count: number }>();
    
    articles.forEach((article: any) => {
      const lang = article.language || 'en';
      if (!languageMap.has(lang)) {
        languageMap.set(lang, { name: getLanguageName(lang), count: 0 });
      }
      languageMap.get(lang)!.count++;
    });

    // Build available_languages array (only languages with 1+ articles, sorted by count)
    const available_languages = Array.from(languageMap.entries())
      .map(([code, data]) => ({
        code,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    // Determine default language (most common)
    const defaultLanguage = available_languages.length > 0 
      ? available_languages[0].code 
      : 'en';

    // Prioritize local sources (TLD matching)
    const prioritizedArticles = articles.sort((a: any, b: any) => {
      const aIsLocal = isLocalSource(a.url, source_country);
      const bIsLocal = isLocalSource(b.url, source_country);
      if (aIsLocal && !bIsLocal) return -1;
      if (!aIsLocal && bIsLocal) return 1;
      return 0;
    });

    const responseData = {
      country: source_country,
      country_name: getCountryName(source_country),
      available_languages,
      default_language: defaultLanguage,
      news: prioritizedArticles,
      status: articles.length === 0 ? 'empty' : available_languages.length > 0 ? 'success' : 'partial',
    };

    // Cache the response for 10 minutes (shared across all users)
    setCachedNewsResponse(cacheKey, responseData);
    console.log('📦 Cached news response for 10 minutes');

    await logEvent({
      eventType: TelemetryEvents.CACHE_MISS,
      userId: user.id,
      endpoint: 'fetch-news',
      metadata: { 
        cacheKey,
        articleCount: articles.length,
        cached: true,
      },
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: 'Failed to fetch news from WorldNews API'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano',
    pt: 'Português', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어',
    ar: 'العربية', hi: 'हिन्दी', bn: 'বাংলা', ur: 'اردو', tr: 'Türkçe',
    vi: 'Tiếng Việt', th: 'ไทย', nl: 'Nederlands', pl: 'Polski', id: 'Bahasa Indonesia',
  };
  return names[code] || code.toUpperCase();
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    us: 'United States', gb: 'United Kingdom', ca: 'Canada', au: 'Australia',
    de: 'Germany', fr: 'France', in: 'India', cn: 'China', jp: 'Japan',
    td: 'Chad', ng: 'Nigeria', pk: 'Pakistan', sa: 'Saudi Arabia',
  };
  return names[code.toLowerCase()] || code.toUpperCase();
}

function isLocalSource(url: string, countryCode: string): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const tld = `.${countryCode.toLowerCase()}`;
    
    // Check if domain ends with country TLD
    if (hostname.endsWith(tld)) return true;
    
    // Known local sources
    const localDomains: Record<string, string[]> = {
      td: ['leprogres.td', 'tchadinfos.com'],
      pk: ['geo.tv', 'dawn.com', 'thenews.com.pk'],
      in: ['ndtv.com', 'thehindu.com', 'indianexpress.com'],
      ng: ['punchng.com', 'vanguardngr.com', 'premiumtimesng.com'],
    };
    
    const localList = localDomains[countryCode.toLowerCase()] || [];
    return localList.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}