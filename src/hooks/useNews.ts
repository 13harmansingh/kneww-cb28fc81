import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNewsCache } from "./useNewsCache";
import { useRequestDedupe } from "./useRequestDedupe";

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

const MAX_RETRIES = 2;
const INITIAL_DELAY = 2000; // 2 seconds
const MIN_REQUEST_INTERVAL = 1500; // Minimum 1.5s between requests

const isTransientError = (error: any): boolean => {
  // Only network errors, timeouts, and 5xx errors are transient
  // DO NOT retry 429 (rate limit) - that makes it worse!
  if (error?.message?.includes('network') || error?.message?.includes('timeout')) return true;
  if (error?.status >= 500 && error?.status < 600) return true;
  return false;
};

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
  const mountedRef = useRef(true);
  const { executeRequest, cancelAll } = useRequestDedupe();

  const getRequestKey = useCallback(() => {
    if (aiSearchParams) {
      return `ai-${aiSearchParams.searchText}-${aiSearchParams.entities?.join(',')}`;
    }
    return `${state}-${category}-${sourceCountry || 'us'}-${sourceCountries || 'none'}`;
  }, [state, category, sourceCountry, sourceCountries, aiSearchParams]);

  const fetchNews = useCallback(async (attempt = 0) => {
    if (!state && !aiSearchParams) return;
    
    // Check authentication first
    if (!session) {
      setError("Please log in to view news articles");
      return;
    }

    const requestKey = getRequestKey();

    // Use request deduplication
    return executeRequest(requestKey, async (signal) => {
      if (signal.aborted) return;

      // Enforce minimum time between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Throttling request, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      lastRequestTime = Date.now();
      setLoading(true);
      setError(null);
      
      try {
        // Save search history
        if (session?.user && state) {
          await supabase.from('search_history').insert({
            user_id: session.user.id,
            state,
            category
          });
        }

        const { data, error: fetchError } = await supabase.functions.invoke("fetch-news", {
          body: {
            state: aiSearchParams ? undefined : state,
            category,
            language: language === 'all' ? undefined : language,
            source_country: sourceCountry || 'us',
            source_countries: sourceCountries,
            searchText: aiSearchParams?.searchText,
            entities: aiSearchParams?.entities?.join(',')
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (fetchError) {
          if (signal.aborted) return;
          
          // Handle rate limit errors specially - don't retry, use cache
          if (isRateLimitError(fetchError)) {
            console.warn('Rate limit hit, attempting to use cached data...');
            
            // Try to get cached data for any language for this location
            const anyCached = !aiSearchParams ? getCachedNewsAnyLanguage(state, category, sourceCountry || 'us', sourceCountries) : null;
            
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

        if (data?.news) {
          const articlesWithAnalysis = data.news.map((article: NewsArticle) => ({
            ...article,
            analysisLoading: true,
            bias: 'Analyzing...',
            summary: 'AI analysis in progress...',
            ownership: 'Analyzing...',
            sentiment: 'neutral' as const,
            claims: []
          }));
          setNews(articlesWithAnalysis);
          setAvailableLanguages(data.available_languages || []);
          setDefaultLanguage(data.default_language || 'en');
          
          // Cache the initial results
          setCachedNews(state, category, language, sourceCountry, articlesWithAnalysis, data.available_languages || [], data.default_language || 'en', sourceCountries);

          // Analyze each article with AI
          articlesWithAnalysis.forEach(async (article: NewsArticle, index: number) => {
            try {
              const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-news', {
                body: { 
                  title: article.title,
                  text: article.text,
                  url: article.url
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (!analysisError && analysisData) {
                setNews(prev => {
                  const updated = prev.map((a, i) => 
                    i === index 
                      ? { 
                          ...a, 
                          bias: analysisData.bias,
                          summary: analysisData.summary,
                          ownership: analysisData.ownership,
                          sentiment: analysisData.sentiment,
                          claims: analysisData.claims,
                          analysisLoading: false
                        }
                      : a
                  );
                  
                  // Update cache with analyzed article
                  setCachedNews(state, category, language, sourceCountry, updated, availableLanguages, defaultLanguage, sourceCountries);
                  return updated;
                });
              }
            } catch (err) {
              console.error('Error analyzing article:', err);
              setNews(prev => prev.map((a, i) => 
                i === index 
                  ? { 
                      ...a, 
                      bias: 'Unknown',
                      summary: a.text?.substring(0, 200) || 'No summary available',
                      ownership: 'Unknown',
                      sentiment: 'neutral' as const,
                      claims: [],
                      analysisLoading: false
                    }
                    : a
              ));
            }
          });
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
        setLoading(false);
      }
    });
  }, [state, category, session, language, sourceCountry, sourceCountries, aiSearchParams, getCachedNews, setCachedNews, getCachedNewsAnyLanguage, getRequestKey, executeRequest]);

  const retry = useCallback(() => {
    setError(null);
    fetchNews(0);
  }, [fetchNews]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNews();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchNews]);

  return { news, availableLanguages, defaultLanguage, loading, error, retry };
};
