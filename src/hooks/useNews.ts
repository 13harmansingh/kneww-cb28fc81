import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NewsArticle {
  id: string;
  title: string;
  text?: string;
  url?: string;
  image?: string;
  publish_date?: string;
  author?: string;
  source_country?: string;
}

export const useNews = (state: string | null, category: string) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) return;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("fetch-news", {
          body: { state, category },
        });

        if (error) throw error;

        if (data?.news) {
          setNews(data.news);
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
