import { useState, useCallback } from "react";
import { NewsArticle } from "./useNews";

interface CachedNewsData {
  news: NewsArticle[];
  available_languages: Array<{ code: string; name: string; count: number }>;
  default_language: string;
  status: string;
  timestamp: number;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const newsCache = new Map<string, CachedNewsData>();

export const useNewsCache = () => {
  const [cache] = useState(newsCache);

  const getCacheKey = useCallback((
    state: string,
    category: string,
    language: string = 'all',
    sourceCountry: string = 'us',
    sourceCountries?: string
  ) => {
    return `${state}-${category}-${language}-${sourceCountry}-${sourceCountries || 'none'}`;
  }, []);

  const getCachedNews = useCallback((
    state: string,
    category: string,
    language: string = 'all',
    sourceCountry: string = 'us',
    sourceCountries?: string
  ): CachedNewsData | null => {
    const key = getCacheKey(state, category, language, sourceCountry, sourceCountries);
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    
    return cached;
  }, [cache, getCacheKey]);

  const setCachedNews = useCallback((
    state: string,
    category: string,
    language: string,
    sourceCountry: string,
    news: NewsArticle[],
    available_languages: Array<{ code: string; name: string; count: number }>,
    default_language: string,
    sourceCountries?: string
  ) => {
    const key = getCacheKey(state, category, language, sourceCountry, sourceCountries);
    cache.set(key, {
      news,
      available_languages,
      default_language,
      status: 'success',
      timestamp: Date.now(),
    });
  }, [cache, getCacheKey]);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { getCachedNews, setCachedNews, clearCache };
};
