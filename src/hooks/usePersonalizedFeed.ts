import { useState, useEffect, useCallback, useRef } from 'react';
import { invokeEdgeFunction } from '@/api/client';
import { NewsArticle } from './useNews';
import { useRequestDedupe } from './useRequestDedupe';
import { useFollowManager } from './useFollowManager';
import { toast } from 'sonner';

interface PersonalizedFeedResponse {
  news: NewsArticle[];
  status: string;
  cache_hit?: boolean;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const PAGE_SIZE = 20;

interface CachedFeedData {
  items: NewsArticle[];
  timestamp: number;
  page: number;
}

const feedCache = new Map<string, CachedFeedData>();

export const usePersonalizedFeed = () => {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const { executeRequest } = useRequestDedupe<PersonalizedFeedResponse>();
  const { follows } = useFollowManager();
  const abortControllerRef = useRef<AbortController | null>(null);
  const seenArticleIds = useRef<Set<string>>(new Set());

  // Listen for follow updates
  useEffect(() => {
    const handleFollowUpdate = () => {
      // Reset feed when follows change
      setPage(1);
      setItems([]);
      seenArticleIds.current.clear();
      feedCache.clear();
    };

    window.addEventListener('follow-updated', handleFollowUpdate);
    return () => window.removeEventListener('follow-updated', handleFollowUpdate);
  }, []);

  // Generate cache key
  const getCacheKey = useCallback((pageNum: number) => {
    const states = follows.filter(f => f.follow_type === 'state').map(f => f.value).sort().join(',');
    const topics = follows.filter(f => f.follow_type === 'topic').map(f => f.value).sort().join(',');
    return `${states}|${topics}|${pageNum}`;
  }, [follows]);

  // Fetch feed
  const fetchFeed = useCallback(async (pageNum: number) => {
    if (loading) return;

    const cacheKey = getCacheKey(pageNum);
    const cached = feedCache.get(cacheKey);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const newItems = cached.items.filter(item => !seenArticleIds.current.has(item.id));
      newItems.forEach(item => seenArticleIds.current.add(item.id));
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === PAGE_SIZE);
      return;
    }

    setLoading(true);
    setError(null);

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const states = follows.filter(f => f.follow_type === 'state').map(f => f.value);
      const topics = follows.filter(f => f.follow_type === 'topic').map(f => f.value);

      const requestKey = `personalized-feed-${pageNum}`;
      
      const response = await executeRequest(requestKey, async (signal) => {
        abortControllerRef.current = signal as any;
        
        const apiResponse = await invokeEdgeFunction<PersonalizedFeedResponse>({
          functionName: 'fetch-personalized-feed',
          body: {
            states,
            topics,
            page: pageNum,
            pageSize: PAGE_SIZE,
            excludeIds: Array.from(seenArticleIds.current)
          },
          signal
        });
        
        // Return just the data from the API response
        if (apiResponse.data) {
          return apiResponse.data;
        }
        throw new Error('No data received from API');
      });

      if (response && response.news) {
        // Deduplicate by ID
        const newItems = response.news.filter(item => !seenArticleIds.current.has(item.id));
        newItems.forEach(item => seenArticleIds.current.add(item.id));

        // Cache the results
        feedCache.set(cacheKey, {
          items: response.news,
          timestamp: Date.now(),
          page: pageNum
        });

        setItems(prev => [...prev, ...newItems]);
        setHasMore(newItems.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching personalized feed:', err);
        setError(err.message || 'Failed to load feed');
        toast.error('Failed to load personalized feed');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, follows, getCacheKey, executeRequest]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  }, [loading, hasMore, page, fetchFeed]);

  // Initial load
  useEffect(() => {
    if (follows.length >= 0 && items.length === 0 && !loading) {
      fetchFeed(1);
    }
  }, [follows, items.length, loading]); // Only run when follows change or initial load

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    follows,
    loadMore,
    retry: () => {
      setError(null);
      fetchFeed(page);
    }
  };
};
