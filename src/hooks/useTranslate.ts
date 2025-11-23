import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useRequestDedupe } from './useRequestDedupe';
import { translateArticle } from '@/api/translation';
import { NewsArticle } from '@/config/types';

export function useTranslate() {
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const { executeRequest, cancelAll } = useRequestDedupe();

  const translate = useCallback(async (
    article: NewsArticle,
    targetLanguage: string
  ): Promise<NewsArticle | null> => {
    if (!session) return null;

    setTranslating(prev => ({ ...prev, [article.id]: true }));
    setError(null);

    try {
      const key = `translate-${article.id}-${targetLanguage}`;
      
      const result = await executeRequest(key, async (signal) => {
        const response = await translateArticle(
          {
            title: article.title,
            text: article.text,
            summary: article.summary,
            bias: article.bias,
            ownership: article.ownership,
            targetLanguage,
          },
          { signal }
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (!response.data) {
          throw new Error('No translation data returned');
        }

        return {
          ...article,
          title: response.data.title,
          text: response.data.text,
          summary: response.data.summary || article.summary,
          bias: response.data.bias || article.bias,
          ownership: response.data.ownership || article.ownership,
        };
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      console.error('[useTranslate] Error:', err);
      return null;
    } finally {
      setTranslating(prev => ({ ...prev, [article.id]: false }));
    }
  }, [session, executeRequest]);

  return {
    translate,
    translating,
    error,
    cancel: cancelAll,
  };
}
