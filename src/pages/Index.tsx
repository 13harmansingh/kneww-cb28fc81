import { Search, Bell, ArrowRight, MapPin, Scale, Bookmark, Globe, Languages, Sparkles, Loader2, ChevronLeft, CheckCircle2, Flag } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { NewsCard } from "@/components/NewsCard";
import { ArticleItem } from "@/components/ArticleItem";
import { CategoryPill } from "@/components/CategoryPill";
import { LanguagePill } from "@/components/LanguagePill";
import { StateMapCard } from "@/components/StateMapCard";
import { CountryMapCard } from "@/components/CountryMapCard";
import { ContinentMapCard } from "@/components/ContinentMapCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SwipeIndicator } from "@/components/SwipeIndicator";
import { PersonalizedFeed } from "@/components/personalized/PersonalizedFeed";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { US_STATES } from "@/data/usStates";
import { CANADA_PROVINCES } from "@/data/canadaProvinces";
import { AUSTRALIA_STATES } from "@/data/australiaStates";
import { INDIA_STATES } from "@/data/indiaStates";
import { COUNTRIES, REGIONS, getCountriesByRegion } from "@/data/countries";
import { useNews } from "@/hooks/useNews";
import { NewsArticle } from "@/config/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useAppState } from "@/stores/appState";
const Index = () => {
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Global app state with persistence
  const {
    selectedRegion: globalSelectedRegion,
    selectedCountry: globalSelectedCountry,
    selectedState: globalSelectedState,
    selectedLanguage: globalSelectedLanguage,
    setSelectedRegion: setGlobalSelectedRegion,
    setSelectedCountry: setGlobalSelectedCountry,
    setSelectedState: setGlobalSelectedState,
    setSelectedLanguage: setGlobalSelectedLanguage
  } = useAppState();

  // Local state (mirrors global state for component logic)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(globalSelectedRegion);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(globalSelectedCountry);
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(globalSelectedState);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<NewsArticle[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(globalSelectedLanguage);
  const [userLanguage, setUserLanguage] = useState("en");
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translatedNews, setTranslatedNews] = useState<Record<string, Partial<NewsArticle>>>({});
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchParams, setAiSearchParams] = useState<{
    searchText?: string;
    entities?: string[];
  } | undefined>(undefined);

  // Guard: ensure router context exists
  if (!routerLocation) return null;

  // Scroll position restoration
  useScrollRestoration({
    pageKey: 'index-page',
    enabled: true
  });
  const {
    user,
    session,
    loading: authLoading
  } = useAuth();
  const {
    isBanned,
    loading: roleLoading
  } = useUserRole();
  
  // Onboarding tour for first-time users
  const {
    showOnboarding,
    loading: onboardingLoading,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding({ userId: user?.id });
  const categories = ["All", "Politics", "Sports", "Technology", "Entertainment"];
  const location = selectedState || selectedCountryName || selectedRegion;
  const sourceCountryCode = selectedCountry || undefined;

  // For continent-level, get all country codes
  const sourceCountryCodes = selectedRegion && !selectedCountry ? getCountriesByRegion(selectedRegion).map(c => c.code).join(',') : undefined;
  const handleBackNavigation = () => {
    if (selectedState) {
      handleBackToStates();
    } else if (selectedCountry) {
      handleBackToCountries();
    } else if (selectedRegion || aiSearchParams) {
      handleBackToRegions();
    }
  };
  const {
    news,
    availableLanguages,
    defaultLanguage,
    loading,
    error,
    retry
  } = useNews(aiSearchParams ? undefined : location, selectedCategory, session, selectedLanguage, aiSearchParams ? undefined : sourceCountryCode, aiSearchParams ? undefined : sourceCountryCodes, aiSearchParams);

  // Swipe navigation
  const {
    swipeProgress,
    swipeDirection
  } = useSwipeNavigation({
    enabled: true,
    onSwipeRight: handleBackNavigation
  });

  // Filter news by selected language on client side and apply translations
  const filteredNews = useMemo(() => {
    let articles = selectedLanguage === 'all' ? news : news.filter(article => article.language === selectedLanguage);

    // Apply translations if available
    return articles.map(article => {
      const translation = translatedNews[article.id];
      return translation ? {
        ...article,
        ...translation
      } : article;
    });
  }, [news, selectedLanguage, translatedNews]);
  useEffect(() => {
    const country = searchParams.get("country");
    const countryName = searchParams.get("countryName");
    if (country && countryName) {
      // Set country and country name regardless of whether it's in our list
      setSelectedCountry(country);
      setSelectedCountryName(countryName);

      // Try to find and set the region for this country
      const countryData = COUNTRIES.find(c => c.code === country);
      if (countryData) {
        setSelectedRegion(countryData.region);
        // Clear selectedState if new country doesn't have states
        if (!countryData.hasStates) {
          setSelectedState(null);
        }
      } else {
        // Country not in our list, but still show news for it
        // Default to a general region or keep existing selection
        setSelectedRegion(null);
        // Clear state for unknown countries
        setSelectedState(null);
      }

      // Clear AI search params to show location-based news
      setAiSearchParams(undefined);
      toast.success(`Curating stories from ${countryName}...`);
    }
  }, [searchParams]);

  // Fetch user's principal language and sync with global store
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        const {
          data
        } = await supabase.from("profiles").select("principal_language").eq("id", user.id).single();
        if (data?.principal_language) {
          setUserLanguage(data.principal_language);
          setSelectedLanguage(data.principal_language);
          setGlobalSelectedLanguage(data.principal_language);
        }
      }
    };
    fetchUserLanguage();
  }, [user, setGlobalSelectedLanguage]);

  // Sync local state with global state on changes
  useEffect(() => {
    setGlobalSelectedRegion(selectedRegion);
  }, [selectedRegion, setGlobalSelectedRegion]);
  useEffect(() => {
    setGlobalSelectedCountry(selectedCountry);
  }, [selectedCountry, setGlobalSelectedCountry]);
  useEffect(() => {
    setGlobalSelectedState(selectedState);
  }, [selectedState, setGlobalSelectedState]);
  useEffect(() => {
    setGlobalSelectedLanguage(selectedLanguage);
  }, [selectedLanguage, setGlobalSelectedLanguage]);
  const filteredRegions = REGIONS.filter(region => region.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCountries = selectedRegion ? getCountriesByRegion(selectedRegion).filter(country => country.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // Get states based on selected country
  const getStatesForCountry = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country?.hasStates) return [];
    switch (country.stateType) {
      case 'us-states':
        return US_STATES;
      case 'canada-provinces':
        return CANADA_PROVINCES;
      case 'australia-states':
        return AUSTRALIA_STATES;
      case 'india-states':
        return INDIA_STATES;
      default:
        return [];
    }
  };
  const currentStates = selectedCountry ? getStatesForCountry(selectedCountry) : [];
  const filteredStates = currentStates.filter(state => state.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedLanguage('all'); // Reset language when changing region
    setSearchQuery("");
  };
  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setSelectedCountry(countryCode);
    setSelectedCountryName(countryName);
    setSelectedLanguage('all'); // Reset language when changing country
    // Fetch news immediately for the country, even if it has states
  };
  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedLanguage('all'); // Reset language when changing state
  };
  const handleBackToRegions = () => {
    setSelectedRegion(null);
    setSelectedCountry(null);
    setSelectedCountryName(null);
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedLanguage('all');
    setSelectedForCompare([]);
    setAiSearchParams(undefined);
    navigate("/");
  };
  const handleBackToCountries = () => {
    setSelectedCountry(null);
    setSelectedCountryName(null);
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedLanguage('all');
    setSelectedForCompare([]);
    setAiSearchParams(undefined);
  };
  const handleBackToStates = () => {
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedLanguage('all');
    setSelectedForCompare([]);
    setAiSearchParams(undefined);
  };

  // Fetch user's preferred language from profile
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        const {
          data
        } = await supabase.from('profiles').select('principal_language').eq('id', user.id).single();
        if (data?.principal_language) {
          setUserLanguage(data.principal_language);
        }
      }
    };
    fetchUserLanguage();
  }, [user]);
  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim() || aiSearchQuery.length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }
    setAiSearching(true);
    try {
      // AI search is global by default - searches worldwide by entities and topics
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-search-news', {
        body: {
          query: aiSearchQuery,
          language: userLanguage
        }
      });
      if (error) throw error;
      console.log('AI Search result:', data);

      // Set AI search parameters to trigger news fetching with entities
      setAiSearchParams({
        searchText: data.searchText || aiSearchQuery,
        entities: data.entities || []
      });

      // Clear location-based selections for global AI search
      setSelectedRegion(null);
      setSelectedCountry(null);
      setSelectedCountryName(null);
      setSelectedState(null);

      // AI search is always global unless user explicitly mentioned location
      toast.success(`Curating global intelligence: ${data.searchText || aiSearchQuery}`);
      setAiSearchQuery("");
    } catch (error) {
      console.error('AI Search error:', error);
      toast.error("Search failed. Using your query directly.");
      setAiSearchParams({
        searchText: aiSearchQuery,
        entities: []
      });
      setAiSearchQuery("");
    } finally {
      setAiSearching(false);
    }
  };
  const translateArticle = async (articleId: string, article: NewsArticle) => {
    if (translating[articleId]) return;
    setTranslating(prev => ({
      ...prev,
      [articleId]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('translate-article', {
        body: {
          title: article.title,
          text: article.text,
          summary: article.summary,
          bias: article.bias,
          ownership: article.ownership,
          targetLanguage: userLanguage
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (error) throw error;
      if (data) {
        toast.success(`Content localized to ${userLanguage.toUpperCase()}`);

        // Store the translated version
        setTranslatedNews(prev => ({
          ...prev,
          [articleId]: {
            title: data.title || article.title,
            text: data.text || article.text,
            summary: data.summary || article.summary,
            bias: data.bias || article.bias,
            ownership: data.ownership || article.ownership,
            language: userLanguage // Mark as translated to user's language
          }
        }));
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Localization temporarily unavailable');
    } finally {
      setTranslating(prev => ({
        ...prev,
        [articleId]: false
      }));
    }
  };
  const toggleArticleForCompare = (article: NewsArticle) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(a => a.id === article.id);
      if (exists) {
        return prev.filter(a => a.id !== article.id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, article];
    });
  };
  const handleCompare = () => {
    navigate("/compare", {
      state: {
        articles: selectedForCompare
      }
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>;
  }

  // Require authentication
  if (!user || !session) {
    navigate("/login");
    return null;
  }
  return <div className="min-h-screen bg-background pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
            <input type="text" value={aiSearchQuery} onChange={e => setAiSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiSearch()} className="w-full bg-accent/10 border-2 border-accent rounded-full py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Ask anything... " />
          </div>
          <button onClick={handleAiSearch} disabled={aiSearching || aiSearchQuery.length < 2} title="AI Search" className="p-3 rounded-full transition disabled:cursor-not-allowed bg-[sidebar-accent-foreground] bg-transparent text-slate-50 opacity-100">
            {aiSearching ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Search className="w-5 h-5 text-white" />}
          </button>
          <NotificationBell />
        </div>
        {aiSearching && <div className="bg-accent/5 rounded-lg p-2 border border-accent/20 mb-2">
            <p className="text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1 text-accent" />
              Our AI is synthesizing intelligence across global sources...
            </p>
          </div>}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">KNEW</h1>
          {(selectedState || selectedCountry || selectedRegion || aiSearchParams) && <button onClick={handleBackNavigation} className="ml-auto p-2 rounded-full hover:bg-accent/20 transition" title="Go Back">
              <ChevronLeft className="w-5 h-5 text-accent" />
            </button>}
          <span className="text-xs text-muted-foreground">Global News Platform</span>
        </div>

        {/* Breadcrumb Navigation */}
        {(selectedRegion || selectedCountry || selectedState) && !aiSearchParams && <div className="mt-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={handleBackToRegions} className="cursor-pointer text-muted-foreground hover:text-accent transition">
                    🌍 World
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                {selectedRegion && <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {selectedCountry ? <BreadcrumbLink onClick={handleBackToCountries} className="cursor-pointer text-muted-foreground hover:text-accent transition">
                          {REGIONS.find(r => r.id === selectedRegion)?.name}
                        </BreadcrumbLink> : <BreadcrumbPage className="text-accent font-medium">
                          {REGIONS.find(r => r.id === selectedRegion)?.name}
                        </BreadcrumbPage>}
                    </BreadcrumbItem>
                  </>}

                {selectedCountry && <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {selectedState ? <BreadcrumbLink onClick={handleBackToStates} className="cursor-pointer text-muted-foreground hover:text-accent transition">
                          {selectedCountryName}
                        </BreadcrumbLink> : <BreadcrumbPage className="text-accent font-medium">
                          {selectedCountryName}
                        </BreadcrumbPage>}
                    </BreadcrumbItem>
                  </>}

                {selectedState && <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-accent font-medium">
                        {selectedState}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>}
              </BreadcrumbList>
            </Breadcrumb>
          </div>}
      </div>

      {aiSearchParams ? (/* AI Search Results View */
    <>
          {/* AI Search Header */}
          <div className="px-4 mt-6">
            <button onClick={() => setAiSearchParams(undefined)} className="flex items-center gap-2 text-accent mb-4 hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Clear Search
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <Sparkles className="w-24 h-24 text-accent" />
              <div>
                <h2 className="text-3xl font-bold text-white">
                  AI Search Results
                </h2>
                <p className="text-muted-foreground">
                  Showing worldwide news for: {aiSearchParams.searchText}
                </p>
              </div>
            </div>
          </div>

          {/* Explore Categories */}
          <div className="px-4 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Categories</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(category => <CategoryPill key={category} label={category} isActive={selectedCategory === category.toLowerCase()} onClick={() => setSelectedCategory(category.toLowerCase())} />)}
            </div>
          </div>

          {/* Dynamic Language Selector - Only show if we have languages */}
          {availableLanguages.length > 0 && <div className="px-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Languages</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'}
                </p>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <LanguagePill key="all" code="all" name="All Languages" count={news.length} isActive={selectedLanguage === 'all'} onClick={() => {
            setSelectedLanguage('all');
            setGlobalSelectedLanguage('all');
          }} />
                {availableLanguages.map(lang => <LanguagePill key={lang.code} code={lang.code} name={lang.name} count={lang.count} isActive={selectedLanguage === lang.code} onClick={() => {
            setSelectedLanguage(lang.code);
            setGlobalSelectedLanguage(lang.code);
          }} />)}
              </div>
            </div>}

          {/* Compare Bar */}
          {selectedForCompare.length > 0 && <div className="fixed bottom-24 left-0 right-0 z-20 px-4">
              <div className="bg-accent/90 backdrop-blur rounded-2xl p-4 border border-accent shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">
                      {selectedForCompare.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedForCompare([])} className="px-3 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition">
                      Clear
                    </button>
                    {selectedForCompare.length >= 2 && <button onClick={handleCompare} className="px-4 py-2 bg-white text-accent rounded-lg text-sm font-semibold hover:bg-white/90 transition">
                        Compare
                      </button>}
                  </div>
                </div>
              </div>
            </div>}

          {/* News Feed */}
          <div className="px-4 mt-6">
            {error ? <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                  <div className="text-destructive text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load News</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <button onClick={retry} className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition">
                    Retry
                  </button>
                </div>
              </div> : loading ? <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading news...</p>
              </div> : filteredNews.length > 0 ? <div className="grid grid-cols-1 gap-6">
                {filteredNews.map(article => {
            const isSelected = selectedForCompare.find(a => a.id === article.id);
            return <ArticleItem key={article.id} article={article} isSelected={!!isSelected} userLanguage={userLanguage} translating={translating} onTranslate={translateArticle} />;
          })}
              </div> : <div className="text-center py-12">
                <div className="text-muted-foreground text-4xl mb-3">📰</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or language filters</p>
              </div>}
          </div>
          
          {/* Swipe Navigation Indicator */}
          <SwipeIndicator progress={swipeProgress} direction={swipeDirection} />
        </>) : !selectedRegion ? (/* Region Selection View */
    <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Flag className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">Select Your Region</h2>
              <p className="text-muted-foreground">Choose a region to explore countries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map(region => <ContinentMapCard key={region.id} region={region} onClick={() => handleRegionSelect(region.id)} />)}
          </div>
        </div>) : !selectedCountry ? (/* Country Selection View */
    <div className="px-4 mt-6">
          <button onClick={handleBackToRegions} className="flex items-center gap-2 text-accent mb-4 hover:underline">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Regions
          </button>
          
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">
                {REGIONS.find(r => r.id === selectedRegion)?.name} - Select Country
              </h2>
              <p className="text-muted-foreground">Choose a country to view news</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCountries.map(country => <CountryMapCard key={country.code} country={country} onClick={() => handleCountrySelect(country.code, country.name)} />)}
          </div>
        </div>) : selectedCountry && COUNTRIES.find(c => c.code === selectedCountry)?.hasStates && !selectedState ? (/* State/Province Selection View */
    <div className="px-4 mt-6">
          <button onClick={handleBackToCountries} className="flex items-center gap-2 text-accent mb-4 hover:underline">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to {REGIONS.find(r => r.id === selectedRegion)?.name}
          </button>
          
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">
                Select {selectedCountry === 'CA' ? 'Province' : selectedCountry === 'AU' ? 'State/Territory' : selectedCountry === 'IN' ? 'State' : 'State'}
              </h2>
              <p className="text-muted-foreground">
                Choose a {selectedCountry === 'CA' ? 'province' : 'state'} to view local news from {selectedCountryName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map(state => <StateMapCard key={state.code} state={state} onClick={() => handleStateSelect(state.name)} />)}
          </div>
        </div>) : (/* News View */
    <>
          {/* Location Header */}
          <div className="px-4 mt-6">
            <button onClick={selectedState ? handleBackToStates : handleBackToCountries} className="flex items-center gap-2 text-accent mb-4 hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" />
              {selectedState ? "Back to States" : `Back to ${REGIONS.find(r => r.id === selectedRegion)?.name || 'Countries'}`}
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              {selectedState && currentStates.find(s => s.name === selectedState) && <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-accent">
                  <StateMapCard state={currentStates.find(s => s.name === selectedState)!} onClick={() => {}} />
                </div>}
              {!selectedState && selectedCountryName && <Globe className="w-24 h-24 text-accent" />}
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {selectedState || selectedCountryName || 'News'}
                </h2>
                <p className="text-muted-foreground">
                  Latest updates {selectedState || selectedCountryName ? `from ${selectedState || selectedCountryName}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Explore Categories */}
          <div className="px-4 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Categories</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(category => <CategoryPill key={category} label={category} isActive={selectedCategory === category.toLowerCase()} onClick={() => setSelectedCategory(category.toLowerCase())} />)}
            </div>
          </div>

          {/* Dynamic Language Selector - Only show if we have languages */}
          {availableLanguages.length > 0 && <div className="px-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Languages</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'}
                </p>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <LanguagePill key="all" code="all" name="All Languages" count={news.length} isActive={selectedLanguage === 'all'} onClick={() => {
            setSelectedLanguage('all');
            setGlobalSelectedLanguage('all');
          }} />
                {availableLanguages.map(lang => <LanguagePill key={lang.code} code={lang.code} name={lang.name} count={lang.count} isActive={selectedLanguage === lang.code} onClick={() => {
            setSelectedLanguage(lang.code);
            setGlobalSelectedLanguage(lang.code);
          }} />)}
              </div>
            </div>}

          {/* Compare Bar */}
          {selectedForCompare.length > 0 && <div className="fixed bottom-24 left-0 right-0 z-20 px-4">
              <div className="bg-accent/90 backdrop-blur rounded-2xl p-4 border border-accent shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">
                      {selectedForCompare.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedForCompare([])} className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition">
                      Clear
                    </button>
                    {selectedForCompare.length >= 2 && <button onClick={handleCompare} className="px-4 py-2 bg-white text-accent rounded-lg text-sm font-semibold hover:bg-white/90 transition">
                        Compare
                      </button>}
                  </div>
                </div>
              </div>
            </div>}

          {/* News Feed */}
          <div className="px-4 mt-6">
            {error ? <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                  <div className="text-destructive text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load News</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <button onClick={retry} className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition">
                    Retry
                  </button>
                </div>
              </div> : loading ? <div className="grid grid-cols-1 gap-6">
                {[...Array(3)].map((_, i) => <NewsCardSkeleton key={i} />)}
              </div> : filteredNews.length > 0 ? <div className="grid grid-cols-1 gap-6">
                {filteredNews.map(article => {
            const isSelected = selectedForCompare.find(a => a.id === article.id);
            return <ArticleItem key={article.id} article={article} isSelected={!!isSelected} userLanguage={userLanguage} translating={translating} onTranslate={translateArticle} />;
          })}
              </div> : <div className="text-center py-12">
                {!user ? <div>
                    <p className="text-muted-foreground">Please log in to view news for {selectedState || selectedCountryName}.</p>
                    <a href="/login" className="inline-block mt-4 px-4 py-2 bg-accent text-white rounded-lg">Log in</a>
                  </div> : <p className="text-muted-foreground">No news articles found for {selectedState || selectedCountryName}</p>}
              </div>}
          </div>
          
          {/* Personalized Feed Section - Only for authenticated users */}
          {user && <div className="px-4 mt-16 pt-8 border-t border-border/30">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-1">Your Personalized Feed</h2>
                <p className="text-sm text-muted-foreground">Curated news based on your followed topics and locations</p>
              </div>
              <PersonalizedFeed />
            </div>}
          
          {/* Swipe Navigation Indicator */}
          <SwipeIndicator progress={swipeProgress} direction={swipeDirection} />
        </>)}

      <BottomNav />
      
      {/* Onboarding Tour for first-time users */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </div>;
};
export default Index;