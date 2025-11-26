import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';
import { logEvent, TelemetryEvents } from '../_shared/telemetry.ts';
import { generateNewsCacheKey, getCachedNewsResponse, setCachedNewsResponse } from '../_shared/cache.ts';

interface PersonalizedFeedRequest {
  states: string[];
  topics: string[];
  page: number;
  pageSize: number;
  excludeIds?: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'fetch-personalized-feed');
    
    if (!rateLimitResult.allowed) {
      await logEvent({
        eventType: TelemetryEvents.RATE_LIMIT,
        userId: user.id,
        endpoint: 'fetch-personalized-feed',
        metadata: { ip: clientIP },
      });

      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body: PersonalizedFeedRequest = await req.json();
    const { states = [], topics = [], page = 1, pageSize = 20, excludeIds = [] } = body;

    // Log telemetry
    await logEvent({
      eventType: 'personalized_feed.requested',
      userId: user.id,
      endpoint: 'fetch-personalized-feed',
      metadata: {
        stateCount: states.length,
        topicCount: topics.length,
        page,
        pageSize,
      },
    });

    // Check cache
    const cacheKey = generateNewsCacheKey({
      textQuery: `states:${states.join(',')}|topics:${topics.join(',')}`,
      category: 'all',
      language: 'all',
      source_country: 'us',
    });

    const cached = getCachedNewsResponse(cacheKey);
    if (cached) {
      await logEvent({
        eventType: TelemetryEvents.CACHE_HIT,
        userId: user.id,
        endpoint: 'fetch-personalized-feed',
      });

      return new Response(JSON.stringify({ ...cached, cache_hit: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await logEvent({
      eventType: TelemetryEvents.CACHE_MISS,
      userId: user.id,
      endpoint: 'fetch-personalized-feed',
    });

    // Fetch from WorldNews API
    const WORLDNEWS_API_KEY = Deno.env.get('WORLDNEWS_API_KEY');
    if (!WORLDNEWS_API_KEY) {
      throw new Error('WorldNews API key not configured');
    }

    const results: any[] = [];

    // Build queries
    const queries: string[] = [];

    // Add state queries
    states.forEach(state => {
      queries.push(`location:${state}`);
    });

    // Add topic queries
    topics.forEach(topic => {
      queries.push(topic);
    });

    // If no follows, default to global trending
    if (queries.length === 0) {
      queries.push('trending');
    }

    // Fetch for each query
    const fetchPromises = queries.map(async (query) => {
      const url = new URL('https://api.worldnewsapi.com/search-news');
      url.searchParams.append('api-key', WORLDNEWS_API_KEY);
      url.searchParams.append('text', query);
      url.searchParams.append('language', 'en');
      url.searchParams.append('number', String(Math.ceil(pageSize / queries.length)));
      url.searchParams.append('offset', String((page - 1) * pageSize));

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limit for query: ${query}`);
          return [];
        }
        throw new Error(`WorldNews API error: ${response.status}`);
      }

      const data = await response.json();
      return data.news || [];
    });

    const queryResults = await Promise.all(fetchPromises);
    
    // Merge results
    queryResults.forEach(newsArray => {
      results.push(...newsArray);
    });

    // Deduplicate by URL
    const seen = new Set(excludeIds);
    const deduplicatedResults = results.filter(article => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    });

    // Sort by publish date (newest first)
    deduplicatedResults.sort((a, b) => {
      const dateA = new Date(a.publish_date || 0).getTime();
      const dateB = new Date(b.publish_date || 0).getTime();
      return dateB - dateA;
    });

    // Limit to pageSize
    const paginatedResults = deduplicatedResults.slice(0, pageSize);

    const responseData = {
      news: paginatedResults,
      status: 'success',
      cache_hit: false,
    };

    // Cache the response
    setCachedNewsResponse(cacheKey, responseData);

    await logEvent({
      eventType: 'personalized_feed.page_loaded',
      userId: user.id,
      endpoint: 'fetch-personalized-feed',
      metadata: {
        resultsReturned: paginatedResults.length,
        page,
      },
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in fetch-personalized-feed:', error);
    
    await logEvent({
      eventType: 'personalized_feed.error',
      endpoint: 'fetch-personalized-feed',
      metadata: { error: error?.message || String(error) },
    });

    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
