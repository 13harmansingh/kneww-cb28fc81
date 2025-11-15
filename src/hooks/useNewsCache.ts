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

  const getCacheKey = useCallback((country: string, category: string) => {
    return `${country}-${category}`;
  }, []);

  const getCached = useCallback((country: string, category: string): CachedNewsData | null => {
    const key = getCacheKey(country, category);
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    
    return cached;
  }, [cache, getCacheKey]);

  const setCache = useCallback((
    country: string,
    category: string,
    data: Omit<CachedNewsData, 'timestamp'>
  ) => {
    const key = getCacheKey(country, category);
    cache.set(key, {
      ...data,
      timestamp: Date.now(),
    });
  }, [cache, getCacheKey]);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  return { getCached, setCache, clearCache };
};
