import { Bookmark } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLongPress } from "@/hooks/useLongPress";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import { useLazyAnalysis } from "@/hooks/useLazyAnalysis";

interface NewsCardProps {
  id: string;
  title: string;
  image?: string;
  gradient?: string;
  size?: "large" | "small";
  url?: string;
  onRefresh?: () => void;
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: string;
  claims?: any[];
  language?: string;
  text?: string;
  userLanguage?: string;
  onTranslate?: (id: string) => void;
  onCompare?: (article: any) => void;
}

export const NewsCard = ({ 
  id, 
  title, 
  image, 
  gradient, 
  size = "large", 
  url, 
  onRefresh,
  bias: initialBias,
  summary: initialSummary,
  ownership: initialOwnership,
  sentiment: initialSentiment,
  claims: initialClaims,
  language,
  text,
  userLanguage,
  onTranslate,
  onCompare
}: NewsCardProps) => {
  const location = useLocation();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  // On-demand AI analysis - triggers when user clicks "Analyze Now"
  const { analysis, triggerAnalysis, isAnalyzing, hasAnalysis } = useLazyAnalysis(
    id,
    url || id,
    title,
    text
  );

  // Use lazy analysis results if available, otherwise fall back to initial props
  const bias = analysis.bias || initialBias;
  const summary = analysis.summary || initialSummary;
  const ownership = analysis.ownership || initialOwnership;
  const sentiment = analysis.sentiment || initialSentiment;
  const claims = analysis.claims || initialClaims;

  // Guard: ensure router context exists
  if (!location) return null;

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

  const toggleBookmark = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
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
            bias: bias || null,
            summary: summary || null,
            ownership: ownership || null,
            sentiment: sentiment || null,
            claims: claims ? JSON.parse(JSON.stringify(claims)) : null,
            language: language || null,
            country: null, // Will be populated from article metadata if available
            category: null, // Will be populated from article metadata if available
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

  const handleShare = async () => {
    if (navigator.share && url) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
        toast.success("Shared successfully");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (url) {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleTranslate = () => {
    if (onTranslate) {
      onTranslate(id);
    }
  };

  const handleCompareAction = () => {
    if (onCompare) {
      onCompare({
        id,
        title,
        image,
        url,
        bias,
        summary,
        ownership,
        sentiment,
        claims,
        text,
        language
      });
    }
  };

  // Long press handler
  const { handlers, isLongPressing } = useLongPress({
    onLongPress: (e: any) => {
      const rect = e.target.getBoundingClientRect();
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setMenuOpen(true);
    },
    delay: 500,
  });

  const canTranslate = language && userLanguage && language !== userLanguage;

  return (
    <>
      <Link 
        to={`/article/${id}`}
        state={{ 
          article: {
            id,
            title,
            image,
            url,
            bias,
            summary,
            ownership,
            sentiment,
            claims
          }
        }}
        {...handlers}
        className={cn(
          "block transition-transform",
          isLongPressing && "scale-95"
        )}
      >
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
            <h3 className="text-foreground font-medium line-clamp-3 leading-snug">{title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-accent text-sm">Read more</span>
              <button 
                onClick={toggleBookmark}
                disabled={loading}
                className="text-foreground hover:text-accent transition-colors"
              >
                <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-accent text-accent")} />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        isOpen={menuOpen}
        position={menuPosition}
        onClose={() => setMenuOpen(false)}
        onBookmark={toggleBookmark}
        onTranslate={handleTranslate}
        onShare={handleShare}
        onCompare={handleCompareAction}
        isBookmarked={isBookmarked}
        canTranslate={canTranslate}
      />
    </>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
