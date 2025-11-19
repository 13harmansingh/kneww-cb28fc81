import { useEffect, useRef, useCallback } from "react";

interface PageState {
  [key: string]: any;
  scrollPosition?: number;
}

/**
 * Hook to persist and restore page state using sessionStorage
 * Automatically saves state changes and scroll position
 */
export const usePageState = <T extends PageState>(
  pageKey: string,
  initialState: T,
  dependencies: any[]
) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const isRestoringRef = useRef(false);

  // Restore state on mount
  const getStoredState = useCallback((): T | null => {
    try {
      const stored = sessionStorage.getItem(`page_state_${pageKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error restoring page state:", error);
    }
    return null;
  }, [pageKey]);

  // Save state to sessionStorage
  const saveState = useCallback((state: T) => {
    try {
      // Get current scroll position
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      const stateWithScroll = { ...state, scrollPosition };
      sessionStorage.setItem(`page_state_${pageKey}`, JSON.stringify(stateWithScroll));
    } catch (error) {
      console.error("Error saving page state:", error);
    }
  }, [pageKey]);

  // Clear stored state
  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(`page_state_${pageKey}`);
    } catch (error) {
      console.error("Error clearing page state:", error);
    }
  }, [pageKey]);

  // Restore scroll position
  const restoreScrollPosition = useCallback((position: number) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Add a small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({
          top: position,
          behavior: 'instant' as ScrollBehavior
        });
      }, 100);
    });
  }, []);

  // Save state whenever dependencies change
  useEffect(() => {
    if (!isRestoringRef.current) {
      const currentState = dependencies.reduce((acc, dep, index) => {
        acc[`dep_${index}`] = dep;
        return acc;
      }, {} as any);
      saveState(currentState as T);
    }
  }, dependencies);

  // Save scroll position on scroll with debounce
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        const currentState = dependencies.reduce((acc, dep, index) => {
          acc[`dep_${index}`] = dep;
          return acc;
        }, {} as any);
        saveState(currentState as T);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [saveState, dependencies]);

  return {
    getStoredState,
    saveState,
    clearState,
    restoreScrollPosition,
    setIsRestoring: (value: boolean) => {
      isRestoringRef.current = value;
    }
  };
};
