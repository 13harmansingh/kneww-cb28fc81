import { useCallback } from 'react';

/**
 * Prefetch hook for loading data on hover/focus
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey?: string
) {
  const prefetch = useCallback(() => {
    // Check if already cached
    if (cacheKey && sessionStorage.getItem(cacheKey)) {
      return;
    }

    // Start prefetch
    fetchFn()
      .then((data) => {
        if (cacheKey) {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch((error) => {
        console.warn('[Prefetch] Failed:', error);
      });
  }, [fetchFn, cacheKey]);

  return { prefetch };
}
