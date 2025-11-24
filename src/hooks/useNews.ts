import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNewsCache } from "./useNewsCache";
import { useRequestDedupe } from "./useRequestDedupe";
import { useDebounce } from "./useDebounce";

export interface Claim {
  text: string;
  verification: "verified" | "disputed" | "unverified";
  explanation: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  text?: string;
  url?: string;
  image?: string;
  publish_date?: string;
  author?: string;
  source_country?: string;
  language?: string;
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: "positive" | "negative" | "neutral";
  claims?: Claim[];
  analysisLoading?: boolean;
}

const MIN_REQUEST_INTERVAL = 1500; // Minimum 1.5s between requests

const isRateLimitError = (error: any): boolean => {
  return error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests');
};

export interface AvailableLanguage {
  code: string;
  name: string;
  count: number;
}

// Global state to track last request time for throttling
let lastRequestTime = 0;

export const useNews = (
  state: string | null | undefined,
  category: string,
  session: any,
  language: string = 'all',
  sourceCountry?: string,
  sourceCountries?: string,
  aiSearchParams?: { searchText?: string; entities?: string[] }
) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<AvailableLanguage[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCachedNews, setCachedNews, getCachedNewsAnyLanguage } = useNewsCache();
  const { executeRequest, cancelAll } = useRequestDedupe();
  
  // Debounce search params to prevent excessive API calls
  const debouncedState = useDebounce(state, 500);
  const debouncedCategory = useDebounce(category, 500);
  const debouncedLanguage = useDebounce(language, 500);
  const debouncedSearchText = useDebounce(aiSearchParams?.searchText, 500);

  const getRequestKey = useCallback(() => {
    if (aiSearchParams) {
      return `ai-${debouncedSearchText}-${aiSearchParams.entities?.join(',')}`;
    }
    return `${debouncedState}-${debouncedCategory}-${sourceCountry || 'us'}-${sourceCountries || 'none'}-${debouncedLanguage}`;
  }, [debouncedState, debouncedCategory, sourceCountry, sourceCountries, aiSearchParams, debouncedSearchText, debouncedLanguage]);

  const fetchNews = useCallback(async () => {
    if (!debouncedState && !aiSearchParams) return;
    
    // Check authentication first
    if (!session) {
      setError("Please log in to view news articles");
      return;
    }

    const requestKey = getRequestKey();

    try {
      // Use request deduplication with abort signal support
      await executeRequest(requestKey, async (signal) => {
        // Check if request was cancelled before starting
        if (signal.aborted) return;

        // Enforce minimum time between requests
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Check again after delay
        if (signal.aborted) return;

        lastRequestTime = Date.now();
        setLoading(true);
        setError(null);
        
        try {
          // Save search history
          if (session?.user && debouncedState) {
            await supabase.from('search_history').insert({
              user_id: session.user.id,
              state: debouncedState,
              category: debouncedCategory
            });
          }

          // Check abort signal before making request
          if (signal.aborted) return;

          const { data, error: fetchError } = await supabase.functions.invoke("fetch-news", {
            body: {
              state: aiSearchParams ? undefined : debouncedState,
              category: debouncedCategory,
              language: debouncedLanguage === 'all' ? undefined : debouncedLanguage,
              source_country: sourceCountry || 'us',
              source_countries: sourceCountries,
              searchText: aiSearchParams?.searchText,
              entities: aiSearchParams?.entities?.join(',')
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          // Check abort signal after request
          if (signal.aborted) return;

          if (fetchError) {
            // Handle rate limit errors specially - don't retry, use cache
            if (isRateLimitError(fetchError)) {
              console.warn('Rate limit hit, attempting to use cached data...');
              
              // Try to get cached data for any language for this location
              const anyCached = !aiSearchParams ? getCachedNewsAnyLanguage(debouncedState, debouncedCategory, sourceCountry || 'us', sourceCountries) : null;
              
              if (anyCached) {
                setNews(anyCached.news);
                setAvailableLanguages(anyCached.available_languages);
                setDefaultLanguage(anyCached.default_language);
                setLoading(false);
                return;
              }
              
              throw new Error('Rate limit exceeded. Please wait a minute and try again.');
            }
            
            throw fetchError;
          }

          if (signal.aborted) return;

          if (data?.news) {
            // Return raw articles - AI analysis will be done lazily by NewsCard
            const articles = data.news as NewsArticle[];
            
            setNews(articles);
            setAvailableLanguages(data.available_languages || []);
            setDefaultLanguage(data.default_language || 'en');
            
            // Cache the results
            setCachedNews(debouncedState, debouncedCategory, debouncedLanguage, sourceCountry, articles, data.available_languages || [], data.default_language || 'en', sourceCountries);
            
            console.log(`✅ Fetched ${articles.length} articles - AI analysis will load lazily as you scroll`);
          }
        } catch (error) {
          if (signal.aborted) return;
          
          console.error("Error fetching news:", error);
          setError(
            error instanceof Error 
              ? error.message 
              : "Could not load news articles. Please check your connection and try again."
          );
        } finally {
          if (!signal.aborted) {
            setLoading(false);
          }
        }
      });
    } catch (err) {
      // Handle errors from executeRequest itself
      console.error("Request execution error:", err);
    }
  }, [
    debouncedState, 
    debouncedCategory, 
    debouncedLanguage, 
    session, 
    sourceCountry, 
    sourceCountries, 
    aiSearchParams, 
    getCachedNews, 
    setCachedNews, 
    getCachedNewsAnyLanguage, 
    getRequestKey, 
    executeRequest
  ]);

  const retry = useCallback(() => {
    setError(null);
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchNews();
    
    // Cancel all pending requests on unmount
    return () => {
      cancelAll();
    };
  }, [fetchNews, cancelAll]);

  return { news, availableLanguages, defaultLanguage, loading, error, retry };
};
