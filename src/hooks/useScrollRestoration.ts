import { useEffect, useRef, useCallback } from 'react';
import { useAppState } from '@/stores/appState';

interface UseScrollRestorationOptions {
  pageKey: string;
  enabled?: boolean;
  debounceMs?: number;
}

export const useScrollRestoration = ({
  pageKey,
  enabled = true,
  debounceMs = 150,
}: UseScrollRestorationOptions) => {
  const { getScrollPosition, setScrollPosition, clearOldScrollPositions } = useAppState();
  const hasRestoredRef = useRef(false);
  const saveTimeoutRef = useRef<number>();

  // Restore scroll position on mount
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;

    const savedPosition = getScrollPosition(pageKey);
    
    if (savedPosition) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          left: savedPosition.x,
          top: savedPosition.y,
          behavior: 'instant' as ScrollBehavior,
        });
        
        console.log(`📍 Restored scroll position for ${pageKey}:`, savedPosition);
      });
    }
    
    hasRestoredRef.current = true;

    // Cleanup old positions
    clearOldScrollPositions();
  }, [pageKey, enabled, getScrollPosition, clearOldScrollPositions]);

  // Save scroll position on scroll with debouncing
  const handleScroll = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce scroll saves
    saveTimeoutRef.current = window.setTimeout(() => {
      const x = window.scrollX;
      const y = window.scrollY;
      
      setScrollPosition(pageKey, x, y);
    }, debounceMs);
  }, [pageKey, enabled, debounceMs, setScrollPosition]);

  // Attach scroll listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Save final position on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      const x = window.scrollX;
      const y = window.scrollY;
      setScrollPosition(pageKey, x, y);
    };
  }, [enabled, handleScroll, pageKey, setScrollPosition]);

  // Manual save function (for programmatic scrolls)
  const saveCurrentPosition = useCallback(() => {
    if (!enabled) return;
    
    const x = window.scrollX;
    const y = window.scrollY;
    setScrollPosition(pageKey, x, y);
  }, [pageKey, enabled, setScrollPosition]);

  return {
    saveCurrentPosition,
  };
};
