import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsArticle } from '@/config/types';

interface DailyNewspaper {
  id: string;
  user_id: string;
  articles: NewsArticle[];
  generated_date: string;
  generation_status: 'pending' | 'generating' | 'complete' | 'failed';
  generation_progress: {
    step: number;
    total: number;
    message: string;
  };
  created_at: string;
  updated_at: string;
}

export const useDailyNewspaper = () => {
  const [newspaper, setNewspaper] = useState<DailyNewspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewspaper = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data, error: fetchError } = await supabase
        .from('daily_newspaper')
        .select('*')
        .eq('user_id', user.id)
        .eq('generated_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setNewspaper(data ? {
        ...data,
        articles: (data.articles as any) || [],
        generation_progress: (data.generation_progress as any) || {},
      } as DailyNewspaper : null);
      
      // If generating, poll for updates
      if (data && data.generation_status === 'generating') {
        setGenerating(true);
      } else {
        setGenerating(false);
      }
    } catch (err) {
      console.error('Error fetching newspaper:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewspaper();
  }, [fetchNewspaper]);

  // Poll for updates when generating
  useEffect(() => {
    if (!generating) return;

    const interval = setInterval(() => {
      fetchNewspaper();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [generating, fetchNewspaper]);

  const generateNewspaper = useCallback(async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await supabase.functions.invoke('generate-daily-newspaper', {
        body: { force: false },
      });

      if (response.error) throw response.error;

      // Start polling
      fetchNewspaper();
    } catch (err) {
      console.error('Error generating newspaper:', err);
      setError(String(err));
      setGenerating(false);
    }
  }, [fetchNewspaper]);

  const canGenerate = !newspaper || newspaper.generation_status === 'failed';

  return {
    newspaper,
    loading,
    generating,
    error,
    canGenerate,
    generateNewspaper,
    refresh: fetchNewspaper,
  };
};
