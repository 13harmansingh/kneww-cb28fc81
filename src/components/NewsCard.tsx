import { Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface NewsCardProps {
  id: string;
  title: string;
  image?: string;
  gradient?: string;
  size?: "large" | "small";
  url?: string;
  onRefresh?: () => void;
}

export const NewsCard = ({ id, title, image, gradient, size = "large", url, onRefresh }: NewsCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && url) {
      checkBookmark();
    }
  }, [user, url]);

  const checkBookmark = async () => {
    try {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_url", url || id)
        .single();
      
      setIsBookmarked(!!data);
    } catch (error) {
      // Not bookmarked
    }
  };

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
          .eq("article_url", url || id);
        
        if (error) throw error;
        setIsBookmarked(false);
        toast.success("Bookmark removed");
        onRefresh?.();
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            article_id: id,
            article_title: title,
            article_url: url || id,
            article_image: image,
          });
        
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

  return (
    <Link to={`/article/${id}`}>
      <div className={cn(
        "flex-shrink-0 rounded-2xl overflow-hidden",
        size === "large" ? "w-80" : "w-60"
      )}>
        <div className={cn(
          "relative rounded-2xl overflow-hidden",
          size === "large" ? "h-64" : "h-48"
        )}>
          {gradient ? (
            <div className={cn("w-full h-full", gradient)} />
          ) : image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500" />
          )}
        </div>
        <div className="mt-3 space-y-2">
          <h3 className="text-white font-medium line-clamp-3 leading-snug">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-accent text-sm">Read more</span>
            <button 
              onClick={toggleBookmark}
              disabled={loading}
              className="text-white hover:text-accent transition-colors"
            >
              <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-accent text-accent")} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
