import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const MODEL_VERSION = 'gemini_2.5_flash_v1';
const NEWS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// In-memory cache for WorldNews API responses (shared across all users)
const newsCache = new Map<string, {
  data: any;
  expiresAt: number;
}>();

// Simple hash function for article URLs
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export interface CachedAnalysis {
  bias: string;
  summary: string;
  ownership: string;
  sentiment: string;
  claims: any[];
}

export async function getCachedAnalysis(
  articleUrl: string
): Promise<CachedAnalysis | null> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const articleHash = hashString(articleUrl);

    const { data, error } = await supabase
      .from('ai_analysis_cache')
      .select('analysis, expires_at')
      .eq('article_hash', articleHash)
      .eq('model_version', MODEL_VERSION)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }

    return data.analysis as CachedAnalysis;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCachedAnalysis(
  articleUrl: string,
  analysis: CachedAnalysis
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const articleHash = hashString(articleUrl);

    await supabase.from('ai_analysis_cache').upsert({
      article_hash: articleHash,
      article_url: articleUrl,
      model_version: MODEL_VERSION,
      analysis,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }, {
      onConflict: 'article_hash,model_version'
    });
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't throw - cache failures shouldn't break the main flow
  }
}

// WorldNews API Response Caching
export interface NewsQueryParams {
  textQuery?: string;
  entities?: string;
  category?: string;
  language?: string;
  source_country?: string;
  source_countries?: string;
}

export function generateNewsCacheKey(params: NewsQueryParams): string {
  // Create a deterministic key from query parameters
  const parts = [
    params.textQuery || '',
    params.entities || '',
    params.category || 'all',
    params.language || 'all',
    params.source_countries || params.source_country || 'us',
  ];
  return hashString(parts.join('|'));
}

export function getCachedNewsResponse(cacheKey: string): any | null {
  const cached = newsCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    newsCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

export function getAnyCachedNewsResponse(): any | null {
  // Find ANY non-expired cached response as fallback
  const now = Date.now();
  const cacheSize = newsCache.size;
  
  console.log(`[Cache] Searching for fallback data. Total cache entries: ${cacheSize}`);
  
  for (const [key, value] of newsCache.entries()) {
    const isExpired = now > value.expiresAt;
    console.log(`[Cache] Checking key=${key}, expired=${isExpired}, expiresIn=${Math.floor((value.expiresAt - now) / 1000)}s`);
    
    if (!isExpired) {
      console.log(`[Cache] ✅ Found valid fallback cached data: key=${key}, articles=${value.data?.news?.length || 0}`);
      return value.data;
    }
  }
  
  console.log('[Cache] ❌ No valid cached data found for fallback');
  return null;
}

export function setCachedNewsResponse(cacheKey: string, data: any): void {
  newsCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + NEWS_CACHE_TTL,
  });
  
  // Cleanup old entries periodically (keep cache size manageable)
  if (newsCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of newsCache.entries()) {
      if (now > value.expiresAt) {
        newsCache.delete(key);
      }
    }
  }
}
