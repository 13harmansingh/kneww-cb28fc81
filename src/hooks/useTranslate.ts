import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useRequestDedupe } from './useRequestDedupe';
import { translateArticle } from '@/api/translation';
import { NewsArticle } from '@/config/types';
import { useAppState } from '@/stores/appState';

export function useTranslate() {
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const { executeRequest, cancelAll } = useRequestDedupe();
  const { getCachedTranslation, setCachedTranslation } = useAppState();

  const translate = useCallback(async (
    article: NewsArticle,
    targetLanguage: string
  ): Promise<NewsArticle | null> => {
    if (!session) return null;

    // Check cache first
    const cached = getCachedTranslation(article.id, targetLanguage);
    if (cached) {
      console.log(`✅ Translation cache HIT for article ${article.id} (${targetLanguage})`);
      return {
        ...article,
        title: cached.title || article.title,
        text: cached.text || article.text,
        summary: cached.summary || article.summary,
        bias: cached.bias || article.bias,
        ownership: cached.ownership || article.ownership,
        claims: cached.claims || article.claims,
        language: cached.language,
      };
    }

    console.log(`❌ Translation cache MISS for article ${article.id} (${targetLanguage})`);
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
            claims: article.claims,
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

        const translatedArticle = {
          ...article,
          title: response.data.title,
          text: response.data.text,
          summary: response.data.summary || article.summary,
          bias: response.data.bias || article.bias,
          ownership: response.data.ownership || article.ownership,
          claims: response.data.claims || article.claims,
          language: targetLanguage,
        };

        // Cache the translation
        setCachedTranslation(article.id, targetLanguage, {
          title: translatedArticle.title,
          text: translatedArticle.text,
          summary: translatedArticle.summary,
          bias: translatedArticle.bias,
          ownership: translatedArticle.ownership,
          claims: translatedArticle.claims,
          language: targetLanguage,
        });

        console.log(`📦 Cached translation for article ${article.id} (${targetLanguage})`);

        return translatedArticle;
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      console.error('[useTranslate] Error:', err);
      return null;
    } finally {
      setTranslating(prev => ({ ...prev, [article.id]: false }));
    }
  }, [session, executeRequest, getCachedTranslation, setCachedTranslation]);

  return {
    translate,
    translating,
    error,
    cancel: cancelAll,
  };
}
