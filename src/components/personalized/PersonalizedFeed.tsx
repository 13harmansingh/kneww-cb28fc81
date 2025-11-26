import { useState } from 'react';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { NewsCardSkeleton } from '@/components/skeletons/NewsCardSkeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Heart } from 'lucide-react';
import { FollowingPanel } from '@/components/follow/FollowingPanel';
import { motion } from 'framer-motion';
import { NewsCard } from '@/components/NewsCard';

export const PersonalizedFeed = () => {
  const { items, loading, error, hasMore, follows, loadMore, retry } = usePersonalizedFeed();
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading,
    threshold: 0.8,
    rootMargin: '100px',
  });

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <NewsCard
              id={article.id}
              title={article.title}
              image={article.image}
              url={article.url}
              language={article.language}
              text={article.text}
              bias={article.bias}
              summary={article.summary}
              ownership={article.ownership}
              sentiment={article.sentiment}
              claims={article.claims}
              onTranslate={() => {
                setTranslatingId(article.id);
                setTimeout(() => setTranslatingId(null), 2000);
              }}
            />
          </motion.div>
        ))}

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
            <div className="text-muted-foreground text-sm">Loading more...</div>
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
