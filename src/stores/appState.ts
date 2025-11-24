import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface TranslatedArticle {
  title?: string;
  text?: string;
  summary?: string;
  bias?: string;
  ownership?: string;
  claims?: any[];
  language: string;
  timestamp: number;
}

interface AppState {
  // Scroll positions per page
  scrollPositions: Record<string, ScrollPosition>;
  
  // Selected location state
  selectedRegion: string | null;
  selectedCountry: string | null;
  selectedState: string | null;
  
  // Language selection
  selectedLanguage: string;
  userPrincipalLanguage: string;
  
  // Translation cache: articleId_targetLang -> translated content
  translationCache: Record<string, TranslatedArticle>;
  
  // Actions
  setScrollPosition: (pageKey: string, x: number, y: number) => void;
  getScrollPosition: (pageKey: string) => ScrollPosition | null;
  clearOldScrollPositions: () => void;
  
  setSelectedRegion: (region: string | null) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedState: (state: string | null) => void;
  setSelectedLanguage: (language: string) => void;
  setUserPrincipalLanguage: (language: string) => void;
  
  // Translation cache actions
  getCachedTranslation: (articleId: string, targetLanguage: string) => TranslatedArticle | null;
  setCachedTranslation: (articleId: string, targetLanguage: string, translation: Omit<TranslatedArticle, 'timestamp'>) => void;
  clearOldTranslations: () => void;
  
  clearLocationState: () => void;
}

const SCROLL_POSITION_TTL = 30 * 60 * 1000; // 30 minutes
const TRANSLATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      scrollPositions: {},
      selectedRegion: null,
      selectedCountry: null,
      selectedState: null,
      selectedLanguage: 'all',
      userPrincipalLanguage: 'en',
      translationCache: {},
      
      setScrollPosition: (pageKey: string, x: number, y: number) => {
        set((state) => ({
          scrollPositions: {
            ...state.scrollPositions,
            [pageKey]: {
              x,
              y,
              timestamp: Date.now(),
            },
          },
        }));
      },
      
      getScrollPosition: (pageKey: string) => {
        const position = get().scrollPositions[pageKey];
        
        if (!position) return null;
        
        // Check if position is stale
        if (Date.now() - position.timestamp > SCROLL_POSITION_TTL) {
          return null;
        }
        
        return position;
      },
      
      clearOldScrollPositions: () => {
        const now = Date.now();
        set((state) => {
          const newPositions: Record<string, ScrollPosition> = {};
          
          Object.entries(state.scrollPositions).forEach(([key, pos]) => {
            if (now - pos.timestamp <= SCROLL_POSITION_TTL) {
              newPositions[key] = pos;
            }
          });
          
          return { scrollPositions: newPositions };
        });
      },
      
      setSelectedRegion: (region: string | null) => {
        set({ selectedRegion: region });
      },
      
      setSelectedCountry: (country: string | null) => {
        set({ selectedCountry: country });
      },
      
      setSelectedState: (state: string | null) => {
        set({ selectedState: state });
      },
      
      setSelectedLanguage: (language: string) => {
        set({ selectedLanguage: language });
      },
      
      setUserPrincipalLanguage: (language: string) => {
        set({ userPrincipalLanguage: language });
      },
      
      // Translation cache methods
      getCachedTranslation: (articleId: string, targetLanguage: string) => {
        const cacheKey = `${articleId}_${targetLanguage}`;
        const cached = get().translationCache[cacheKey];
        
        if (!cached) return null;
        
        // Check if expired
        if (Date.now() - cached.timestamp > TRANSLATION_CACHE_TTL) {
          return null;
        }
        
        return cached;
      },
      
      setCachedTranslation: (articleId: string, targetLanguage: string, translation: Omit<TranslatedArticle, 'timestamp'>) => {
        const cacheKey = `${articleId}_${targetLanguage}`;
        set((state) => ({
          translationCache: {
            ...state.translationCache,
            [cacheKey]: {
              ...translation,
              timestamp: Date.now(),
            },
          },
        }));
      },
      
      clearOldTranslations: () => {
        const now = Date.now();
        set((state) => {
          const newCache: Record<string, TranslatedArticle> = {};
          
          Object.entries(state.translationCache).forEach(([key, translation]) => {
            if (now - translation.timestamp <= TRANSLATION_CACHE_TTL) {
              newCache[key] = translation;
            }
          });
          
          return { translationCache: newCache };
        });
      },
      
      clearLocationState: () => {
        set({
          selectedRegion: null,
          selectedCountry: null,
          selectedState: null,
        });
      },
    }),
    {
      name: 'knew-app-state',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        scrollPositions: state.scrollPositions,
        selectedRegion: state.selectedRegion,
        selectedCountry: state.selectedCountry,
        selectedState: state.selectedState,
        selectedLanguage: state.selectedLanguage,
        userPrincipalLanguage: state.userPrincipalLanguage,
        translationCache: state.translationCache,
      }),
    }
  )
);
