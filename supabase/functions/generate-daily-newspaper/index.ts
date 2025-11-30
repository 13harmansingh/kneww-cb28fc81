import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { validateAuth, getClientIP } from '../_shared/auth.ts';
import { applyRateLimit } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  force?: boolean; // Force regeneration even if exists
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: authError || 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = applyRateLimit(user.id, clientIP, 'generate-daily-newspaper');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: rateLimitResult.error }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { force = false } = await req.json() as GenerateRequest;

    // Create Supabase client with service role for background operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if today's newspaper already exists
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('daily_newspaper')
      .select('*')
      .eq('user_id', user.id)
      .eq('generated_date', today)
      .single();

    if (existing && !force) {
      return new Response(JSON.stringify({ newspaper: existing, message: 'Newspaper already generated for today' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user follows
    const { data: follows } = await supabase
      .from('user_follows')
      .select('*')
      .eq('user_id', user.id);

    if (!follows || follows.length === 0) {
      return new Response(JSON.stringify({ error: 'No follows found. Please follow states or topics first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or update newspaper record with pending status
    const { data: newspaper, error: insertError } = await supabase
      .from('daily_newspaper')
      .upsert({
        user_id: user.id,
        generated_date: today,
        generation_status: 'generating',
        generation_progress: { step: 0, total: follows.length + 2, message: 'Initializing...' },
        articles: [],
      }, { onConflict: 'user_id,generated_date' })
      .select()
      .single();

    if (insertError) throw insertError;

    // Start background generation (fire and forget)
    generateNewspaperInBackground(supabase, user.id, newspaper.id, follows).catch(err => 
      console.error('Background generation error:', err)
    );

    return new Response(JSON.stringify({ 
      newspaper, 
      message: 'Generation started',
      status: 'generating'
    }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-newspaper:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateNewspaperInBackground(
  supabase: any,
  userId: string,
  newspaperId: string,
  follows: any[]
) {
  try {
    const allArticles: any[] = [];
    const states = follows.filter(f => f.follow_type === 'state');
    const topics = follows.filter(f => f.follow_type === 'topic');
    const totalSteps = states.length + topics.length + 2;
    let currentStep = 0;

    const WORLDNEWS_API_KEY = Deno.env.get('WORLDNEWS_API_KEY');

    // Step 1: Fetch by states
    for (const stateFollow of states) {
      currentStep++;
      await supabase
        .from('daily_newspaper')
        .update({
          generation_progress: {
            step: currentStep,
            total: totalSteps,
            message: `Gathering intelligence from ${stateFollow.value}...`,
          },
        })
        .eq('id', newspaperId);

      try {
        const stateParam = stateFollow.value.toLowerCase().replace(/\s+/g, '-');
        const url = `https://api.worldnewsapi.com/search-news?text=${encodeURIComponent(stateParam)}&language=en&number=10&sort=publish-time&sort-direction=DESC`;
        
        const response = await fetch(url, {
          headers: { 'x-api-key': WORLDNEWS_API_KEY || '' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.news && Array.isArray(data.news)) {
            allArticles.push(...data.news);
          }
        }
      } catch (error) {
        console.error(`Error fetching state ${stateFollow.value}:`, error);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 2: Fetch by topics
    for (const topicFollow of topics) {
      currentStep++;
      await supabase
        .from('daily_newspaper')
        .update({
          generation_progress: {
            step: currentStep,
            total: totalSteps,
            message: `Discovering stories about ${topicFollow.value}...`,
          },
        })
        .eq('id', newspaperId);

      try {
        const url = `https://api.worldnewsapi.com/search-news?text=${encodeURIComponent(topicFollow.value)}&language=en&number=10&sort=publish-time&sort-direction=DESC`;
        
        const response = await fetch(url, {
          headers: { 'x-api-key': WORLDNEWS_API_KEY || '' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.news && Array.isArray(data.news)) {
            allArticles.push(...data.news);
          }
        }
      } catch (error) {
        console.error(`Error fetching topic ${topicFollow.value}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 3: Deduplicate and shuffle
    currentStep++;
    await supabase
      .from('daily_newspaper')
      .update({
        generation_progress: {
          step: currentStep,
          total: totalSteps,
          message: 'Curating for variety and balance...',
        },
      })
      .eq('id', newspaperId);

    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    );

    // Shuffle articles for variety (Fisher-Yates shuffle)
    for (let i = uniqueArticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueArticles[i], uniqueArticles[j]] = [uniqueArticles[j], uniqueArticles[i]];
    }

    // Step 4: Finalize
    currentStep++;
    await supabase
      .from('daily_newspaper')
      .update({
        generation_progress: {
          step: currentStep,
          total: totalSteps,
          message: 'Finalizing your Daily Brief...',
        },
      })
      .eq('id', newspaperId);

    // Save final newspaper
    await supabase
      .from('daily_newspaper')
      .update({
        articles: uniqueArticles.slice(0, 50), // Limit to 50 articles
        generation_status: 'complete',
        generation_progress: {
          step: totalSteps,
          total: totalSteps,
          message: 'Complete',
        },
      })
      .eq('id', newspaperId);

    // Log telemetry
    await supabase.from('telemetry_logs').insert({
      event_type: 'daily_newspaper_generated',
      user_id: userId,
      endpoint: 'generate-daily-newspaper',
      metadata: {
        article_count: uniqueArticles.length,
        follows_count: follows.length,
        states_count: states.length,
        topics_count: topics.length,
      },
    });

    console.log(`Daily newspaper generated for user ${userId}: ${uniqueArticles.length} articles`);
  } catch (error) {
    console.error('Error generating newspaper in background:', error);
    
    // Mark as failed
    await supabase
      .from('daily_newspaper')
      .update({
        generation_status: 'failed',
        generation_progress: {
          step: 0,
          total: 0,
          message: 'Generation failed',
        },
      })
      .eq('id', newspaperId);
  }
}
