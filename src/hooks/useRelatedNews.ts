import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRequestDedupe } from './useRequestDedupe';
import { fetchRelatedNews } from '@/api/news';
import { analyzeNews } from '@/api/analysis';
import { NewsArticle } from '@/config/types';

interface UseRelatedNewsProps {
  topic?: string;
  language?: string;
  sourceCountry?: string;
}

export function useRelatedNews({ topic, language = 'en', sourceCountry = 'us,gb,ca,au,in' }: UseRelatedNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const { executeRequest, cancelAll } = useRequestDedupe<NewsArticle[]>();

  const load = useCallback(async () => {
    if (!topic || !session) return;

    setLoading(true);
    setError(null);

    try {
      const key = `related-${topic}-${language}`;
      
      const result = await executeRequest(key, async (signal) => {
        const response = await fetchRelatedNews(
          { topic, language, source_country: sourceCountry },
          { signal }
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (!response.data) {
          throw new Error('No data returned');
        }

        const articlesWithAnalysis: NewsArticle[] = response.data.news.map((article: any) => ({
          ...article,
          bias: undefined,
          summary: undefined,
          ownership: undefined,
          claims: undefined,
          sentiment: 'neutral' as const,
        }));

        // Analyze articles in parallel
        articlesWithAnalysis.forEach(async (item: NewsArticle, index: number) => {
          if (signal.aborted) return;
          
          try {
            const analysisResponse = await analyzeNews(
              {
                title: item.title,
                text: item.text,
                url: item.url,
              },
              { signal }
            );

            if (analysisResponse.data && !signal.aborted) {
              setArticles((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...analysisResponse.data };
                return updated;
              });
            }
          } catch (err) {
            console.error('Analysis error:', err);
          }
        });

        return articlesWithAnalysis;
      });

      setArticles(result);
    } catch (err: any) {
      setError(err.message);
      console.error('[useRelatedNews] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [topic, language, sourceCountry, session, executeRequest]);

  useEffect(() => {
    load();
    return () => cancelAll();
  }, [load, cancelAll]);

  const reload = useCallback(() => {
    load();
  }, [load]);

  return { articles, loading, error, reload, cancel: cancelAll };
}
