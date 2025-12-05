import { Bookmark } from "lucide-react";
import { useArticleBookmark } from "@/hooks/useArticleBookmark";
import { NewsArticle } from "@/config/types";
import { cn } from "@/lib/utils";

interface ArticleBookmarkButtonProps {
  article: NewsArticle;
  className?: string;
}

export const ArticleBookmarkButton = ({ article, className }: ArticleBookmarkButtonProps) => {
  const { isBookmarked, loading, toggleBookmark } = useArticleBookmark(article);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark();
      }}
      disabled={loading}
      className={cn(
        "text-foreground hover:text-accent transition-colors",
        className
      )}
    >
      <Bookmark 
        className={cn(
          "w-5 h-5", 
          isBookmarked && "fill-accent text-accent"
        )} 
      />
    </button>
  );
};
