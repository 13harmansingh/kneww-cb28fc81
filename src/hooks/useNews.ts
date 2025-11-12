import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: "positive" | "negative" | "neutral";
  claims?: Claim[];
  analysisLoading?: boolean;
}

export const useNews = (state: string | null, category: string) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) return;

    const fetchNews = async () => {
      setLoading(true);
      try {
        // Check authentication first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("Please log in to view news articles");
          setLoading(false);
          return;
        }

        // Save search history
        if (session?.user) {
          await supabase.from('search_history').insert({
            user_id: session.user.id,
            state,
            category
          });
        }

        const { data, error } = await supabase.functions.invoke("fetch-news", {
          body: { state, category },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

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
                setNews(prev => prev.map((a, i) => 
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
                ));
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
        toast.error("Could not load news articles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [state, category]);

  return { news, loading };
};
