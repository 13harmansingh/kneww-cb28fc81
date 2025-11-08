import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { NewsArticle } from "@/hooks/useNews";

export const useArticleBookmark = (article: NewsArticle) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && article.url) {
      checkBookmark();
    }
  }, [user, article.url]);

  const checkBookmark = async () => {
    try {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_url", article.url || article.id)
        .single();
      
      setIsBookmarked(!!data);
    } catch (error) {
      // Not bookmarked
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("article_url", article.url || article.id);
        
        if (error) throw error;
        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert([{
            user_id: user.id,
            article_id: article.id,
            article_title: article.title,
            article_url: article.url || article.id,
            article_image: article.image || null,
            bias: article.bias || null,
            summary: article.summary || null,
            ownership: article.ownership || null,
            sentiment: article.sentiment || null,
            claims: article.claims ? JSON.parse(JSON.stringify(article.claims)) : null,
          }]);
        
        if (error) throw error;
        setIsBookmarked(true);
        toast.success("Article bookmarked");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  return { isBookmarked, loading, toggleBookmark };
};
