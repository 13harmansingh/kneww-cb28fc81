import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNewsCache } from "./useNewsCache";

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

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

const isTransientError = (error: any): boolean => {
  // Network errors, timeouts, 5xx errors are transient
  if (error?.message?.includes('network') || error?.message?.includes('timeout')) return true;
  if (error?.status >= 500 && error?.status < 600) return true;
  if (error?.status === 429) return true; // Rate limit
  return false;
};

export interface AvailableLanguage {
  code: string;
  name: string;
  count: number;
}

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
  const [retryCount, setRetryCount] = useState(0);
  const { getCachedNews, setCachedNews } = useNewsCache();

  const fetchNews = useCallback(async (attempt = 0) => {
    if (!state && !aiSearchParams) return;
    
    // Check authentication first
    if (!session) {
      setError("Please log in to view news articles");
      return;
    }

    // Check cache first (skip for AI searches)
    const cached = !aiSearchParams ? getCachedNews(state, category, language, sourceCountry || 'us', sourceCountries) : null;
    if (cached && attempt === 0) {
      console.log('Loading from cache');
      setNews(cached.news);
      setAvailableLanguages(cached.available_languages);
      setDefaultLanguage(cached.default_language);
      setLoading(false);
      return;
    }

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
        // Check if error is transient and we should retry
        if (isTransientError(fetchError) && attempt < MAX_RETRIES) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt);
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          setTimeout(() => fetchNews(attempt + 1), delay);
          return;
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
        setRetryCount(0); // Reset retry count on success
        
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
      console.error("Error fetching news:", error);
      setRetryCount(attempt);
      setError(
        error instanceof Error 
          ? error.message 
          : "Could not load news articles. Please check your connection and try again."
      );
      toast.error("Failed to load news articles");
    } finally {
      setLoading(false);
    }
  }, [state, category, session, language, sourceCountry, sourceCountries]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const retry = useCallback(() => {
    fetchNews(0);
  }, [fetchNews]);

  return { news, availableLanguages, defaultLanguage, loading, error, retry };
};
