import { useRef, useCallback } from 'react';

interface PendingRequest<T> {
  promise: Promise<T>;
  abortController: AbortController;
}

export function useRequestDedupe<T = any>() {
  const pendingRequests = useRef<Map<string, PendingRequest<T>>>(new Map());

  const executeRequest = useCallback(
    async (key: string, requestFn: (signal: AbortSignal) => Promise<T>): Promise<T> => {
      // Check if request is already in flight
      const existing = pendingRequests.current.get(key);
      if (existing) {
        console.log(`[DEDUPE] Reusing existing request for key: ${key}`);
        return existing.promise;
      }

      // Create new request with abort controller
      const abortController = new AbortController();
      
      const promise = requestFn(abortController.signal)
        .finally(() => {
          // Clean up after request completes
          pendingRequests.current.delete(key);
        });

      pendingRequests.current.set(key, { promise, abortController });
      
      return promise;
    },
    []
  );

  const cancelRequest = useCallback((key: string) => {
    const existing = pendingRequests.current.get(key);
    if (existing) {
      existing.abortController.abort();
      pendingRequests.current.delete(key);
    }
  }, []);

  const cancelAll = useCallback(() => {
    pendingRequests.current.forEach((req) => {
      req.abortController.abort();
    });
    pendingRequests.current.clear();
  }, []);

  return { executeRequest, cancelRequest, cancelAll };
}
