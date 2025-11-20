import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const MODEL_VERSION = 'gemini_2.5_flash_v1';

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
