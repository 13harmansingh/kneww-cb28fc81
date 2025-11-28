import { useState } from 'react';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { NewsCardSkeleton } from '@/components/skeletons/NewsCardSkeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Heart } from 'lucide-react';
import { FollowingPanel } from '@/components/follow/FollowingPanel';
import { motion } from 'framer-motion';
import { ArticleItem } from '@/components/ArticleItem';
import { NewsArticle } from '@/config/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PersonalizedFeed = () => {
  const { items, loading, error, hasMore, follows, loadMore, retry } = usePersonalizedFeed();
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translatedNews, setTranslatedNews] = useState<Record<string, Partial<NewsArticle>>>({});
  const { session } = useAuth();
  const [userLanguage, setUserLanguage] = useState("en");

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading,
    threshold: 0.8,
    rootMargin: '100px',
  });

  const translateArticle = async (articleId: string, article: NewsArticle) => {
    if (translating[articleId]) return;

    setTranslating((prev) => ({
      ...prev,
      [articleId]: true,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('translate-article', {
        body: {
          title: article.title,
          text: article.text,
          summary: article.summary,
          bias: article.bias,
          ownership: article.ownership,
          targetLanguage: userLanguage,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data) {
        toast.success(`Content localized to ${userLanguage.toUpperCase()}`);

        setTranslatedNews((prev) => ({
          ...prev,
          [articleId]: {
            title: data.title || article.title,
            text: data.text || article.text,
            summary: data.summary || article.summary,
            bias: data.bias || article.bias,
            ownership: data.ownership || article.ownership,
            language: userLanguage,
          },
        }));
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Localization temporarily unavailable');
    } finally {
      setTranslating((prev) => ({
        ...prev,
        [articleId]: false,
      }));
    }
  };

  // Empty state
  if (!loading && items.length === 0 && follows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          Your Feed is Empty
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Follow states or topics to personalize your news feed and discover content tailored to your interests.
        </p>
        <Button variant="default" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Explore News
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Following Panel */}
      {follows.length > 0 && (
        <FollowingPanel />
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={retry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Feed Items */}
      <div className="grid grid-cols-1 gap-6">
        {items.map((article, index) => {
          const translatedArticle = translatedNews[article.id];
          const finalArticle = translatedArticle
            ? { ...article, ...translatedArticle }
            : article;

          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ArticleItem
                article={finalArticle}
                isSelected={false}
                userLanguage={userLanguage}
                translating={translating}
                onTranslate={translateArticle}
              />
            </motion.div>
          );
        })}

        {/* Loading Skeletons */}
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <NewsCardSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && !error && (
        <div ref={sentinelRef} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="text-muted-foreground text-sm">Discovering more stories...</div>
          )}
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && items.length > 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end of your feed
        </div>
      )}
    </div>
  );
};
