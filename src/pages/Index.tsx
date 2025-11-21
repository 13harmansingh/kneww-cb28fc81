import { Search, Bell, ArrowRight, MapPin, Scale, Bookmark, Globe, Languages, Sparkles, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill } from "@/components/CategoryPill";
import { LanguagePill } from "@/components/LanguagePill";
import { StateMapCard } from "@/components/StateMapCard";
import { CountryMapCard } from "@/components/CountryMapCard";
import { ContinentMapCard } from "@/components/ContinentMapCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { US_STATES } from "@/data/usStates";
import { CANADA_PROVINCES } from "@/data/canadaProvinces";
import { AUSTRALIA_STATES } from "@/data/australiaStates";
import { INDIA_STATES } from "@/data/indiaStates";
import { COUNTRIES, REGIONS, getCountriesByRegion } from "@/data/countries";
import { useNews, NewsArticle } from "@/hooks/useNews";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePageState } from "@/hooks/usePageState";
const Index = () => {
  const [searchParams] = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<NewsArticle[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
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
  const [stateRestored, setStateRestored] = useState(false);
  const navigate = useNavigate();

  // Page state persistence hook
  const {
    getStoredState,
    restoreScrollPosition,
    setIsRestoring
  } = usePageState('index-page', {}, [selectedRegion, selectedCountry, selectedCountryName, selectedState, selectedCategory, selectedLanguage, aiSearchMode, aiSearchQuery, aiSearchParams, translatedNews]);
  const {
    user,
    session,
    loading: authLoading
  } = useAuth();
  const categories = ["All", "Politics", "Sports", "Technology", "Entertainment"];
  const location = selectedState || selectedCountryName || selectedRegion;
  const sourceCountryCode = selectedCountry || undefined;

  // For continent-level, get all country codes
  const sourceCountryCodes = selectedRegion && !selectedCountry ? getCountriesByRegion(selectedRegion).map(c => c.code).join(',') : undefined;
  const {
    news,
    availableLanguages,
    defaultLanguage,
    loading,
    error,
    retry
  } = useNews(aiSearchParams ? undefined : location, selectedCategory, session, selectedLanguage, aiSearchParams ? undefined : sourceCountryCode, aiSearchParams ? undefined : sourceCountryCodes, aiSearchParams);

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
      } else {
        // Country not in our list, but still show news for it
        // Default to a general region or keep existing selection
        setSelectedRegion(null);
      }

      // Clear AI search params to show location-based news
      setAiSearchParams(undefined);
      toast.success(`Loading news for ${countryName}`);
    }
  }, [searchParams]);

  // Fetch user's principal language
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        const {
          data
        } = await supabase.from("profiles").select("principal_language").eq("id", user.id).single();
        if (data?.principal_language) {
          setUserLanguage(data.principal_language);
          setSelectedLanguage(data.principal_language);
        }
      }
    };
    fetchUserLanguage();
  }, [user]);

  // Restore page state on mount (before fetching news)
  useEffect(() => {
    const storedState = getStoredState();
    if (storedState && !stateRestored && !searchParams.get("country")) {
      setIsRestoring(true);

      // Restore all state with type safety
      const state = storedState as any;
      if (state.dep_0 !== undefined) setSelectedRegion(state.dep_0);
      if (state.dep_1 !== undefined) setSelectedCountry(state.dep_1);
      if (state.dep_2 !== undefined) setSelectedCountryName(state.dep_2);
      if (state.dep_3 !== undefined) setSelectedState(state.dep_3);
      if (state.dep_4 !== undefined) setSelectedCategory(state.dep_4);
      if (state.dep_5 !== undefined) setSelectedLanguage(state.dep_5);
      if (state.dep_6 !== undefined) setAiSearchMode(state.dep_6);
      if (state.dep_7 !== undefined) setAiSearchQuery(state.dep_7);
      if (state.dep_8 !== undefined) setAiSearchParams(state.dep_8);
      if (state.dep_9 !== undefined) setTranslatedNews(state.dep_9);
      setStateRestored(true);

      // Restore scroll after a short delay to ensure content is rendered
      setTimeout(() => {
        setIsRestoring(false);
        if (state.scrollPosition) {
          restoreScrollPosition(state.scrollPosition);
        }
      }, 200);
    }
  }, [getStoredState, stateRestored, searchParams, setIsRestoring, restoreScrollPosition]);

  // Restore scroll position after news loads
  useEffect(() => {
    if (stateRestored && !loading && filteredNews.length > 0) {
      const storedState = getStoredState();
      if (storedState) {
        const state = storedState as any;
        if (state.scrollPosition) {
          // Additional scroll restoration after content loads
          setTimeout(() => {
            restoreScrollPosition(state.scrollPosition);
          }, 300);
        }
      }
    }
  }, [stateRestored, loading, filteredNews.length, getStoredState, restoreScrollPosition]);
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

    // Check if country has states
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country?.hasStates) {
      // Don't fetch news yet, let user select state
      return;
    }
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
      toast.success(`Searching worldwide: ${data.searchText || aiSearchQuery}`);
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
        toast.success(`Article translated to ${userLanguage.toUpperCase()}`);

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
      toast.error('Failed to translate article');
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }

  // Require authentication
  if (!user || !session) {
    return <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-24">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-3">Please sign in        </h2>
          <p className="text-muted-foreground mb-6">
            to view news articles and explore global news coverage.
          </p>
          <button onClick={() => navigate("/login")} className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition">
            Go to Login
          </button>
        </div>
        <BottomNav />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
            <input type="text" placeholder="Ask anything... (e.g., 'Trump buying Canada news')" value={aiSearchQuery} onChange={e => setAiSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiSearch()} className="w-full bg-accent/10 border-2 border-accent rounded-full py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <button onClick={handleAiSearch} disabled={aiSearching || aiSearchQuery.length < 2} className="p-3 rounded-full bg-accent hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed" title="AI Search">
            {aiSearching ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Search className="w-5 h-5 text-white" />}
          </button>
          <button className="text-foreground">
            <Bell className="w-6 h-6" />
          </button>
        </div>
        {aiSearching && <div className="bg-accent/5 rounded-lg p-2 border border-accent/20 mb-2">
            <p className="text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 inline mr-1 text-accent" />
              AI is understanding your query and finding relevant news worldwide...
            </p>
          </div>}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">KNEW</h1>
          <span className="text-xs text-muted-foreground">Global News Platform</span>
        </div>
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
                {availableLanguages.map(lang => <LanguagePill key={lang.code} code={lang.code} name={lang.name} count={lang.count} isActive={selectedLanguage === lang.code} onClick={() => setSelectedLanguage(lang.code)} />)}
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
            return <div key={article.id} className={`rounded-2xl overflow-hidden border ${isSelected ? 'border-accent ring-2 ring-accent' : 'border-border'} bg-card transition-all`}>
                      {article.image && <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />}
                      <div className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white mb-2 flex-1">{article.title}</h3>
                          <div className="flex items-center gap-2">
                            {article.language && article.language !== userLanguage && <button onClick={() => translateArticle(article.id, article)} disabled={translating[article.id]} className="flex-shrink-0 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition disabled:opacity-50" title={`Translate to ${userLanguage.toUpperCase()}`}>
                                {translating[article.id] ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Languages className="w-4 h-4 text-accent" />}
                              </button>}
                            <ArticleBookmarkButton article={article} />
                            <button onClick={() => navigate('/compare', {
                      state: {
                        article
                      }
                    })} className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition">
                              Compare Sources
                            </button>
                          </div>
                        </div>
                        
                        {/* Article Metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {article.language && <div className="flex items-center gap-1">
                              <span className="font-medium">Language:</span>
                              <span className="uppercase">{article.language}</span>
                            </div>}
                          {article.author && <div className="flex items-center gap-1">
                              <span className="font-medium">Author:</span>
                              <span>{article.author}</span>
                            </div>}
                          {article.publish_date && <div className="flex items-center gap-1">
                              <span className="font-medium">Published:</span>
                              <span>{new Date(article.publish_date).toLocaleDateString()}</span>
                            </div>}
                          {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                              Read original →
                            </a>}
                        </div>
                        
                        {/* Sentiment Badge */}
                        <div>
                          <SentimentBadge sentiment={article.sentiment} loading={article.analysisLoading} />
                        </div>
                        
                        {/* AI Analysis Section */}
                        <div className="space-y-3 bg-secondary/50 rounded-xl p-3 border border-accent/20">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <h4 className="font-semibold text-sm text-foreground">AI Analysis</h4>
                          </div>
                          
                          {article.analysisLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                              <span>Analyzing article...</span>
                            </div> : <>
                              {article.bias && <div>
                                  <span className="text-xs font-medium text-muted-foreground">Political Bias:</span>
                                  <p className="text-sm text-foreground mt-1">{article.bias}</p>
                                </div>}
                              
                              {article.summary && <div>
                                  <span className="text-xs font-medium text-muted-foreground">Summary:</span>
                                  <p className="text-sm text-foreground mt-1">{article.summary}</p>
                                </div>}
                              
                              {article.ownership && <div>
                                  <span className="text-xs font-medium text-muted-foreground">Media Ownership:</span>
                                  <p className="text-sm text-foreground mt-1">{article.ownership}</p>
                                </div>}
                            </>}
                        </div>

                        {/* Claims Section */}
                        {article.claims && article.claims.length > 0 && <div className="space-y-2 bg-secondary/30 rounded-xl p-3 border border-accent/10">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              <h4 className="font-semibold text-sm text-foreground">Fact Check</h4>
                            </div>
                            {article.claims.map((claim, idx) => <div key={idx} className="text-sm space-y-1 pb-2 border-b border-border/50 last:border-0 last:pb-0">
                                <p className="text-foreground italic">"{claim.text}"</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${claim.verification === 'verified' ? 'bg-green-500/20 text-green-400' : claim.verification === 'disputed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {claim.verification}
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-xs">{claim.explanation}</p>
                              </div>)}
                          </div>}

                        {/* Selection Checkbox */}
                        <div className="flex items-center gap-2 pt-2">
                          <input type="checkbox" id={`compare-${article.id}`} checked={!!isSelected} onChange={e => {
                    if (e.target.checked) {
                      if (selectedForCompare.length < 5) {
                        setSelectedForCompare([...selectedForCompare, article]);
                      } else {
                        toast.error("You can compare up to 5 articles at once");
                      }
                    } else {
                      setSelectedForCompare(selectedForCompare.filter(a => a.id !== article.id));
                    }
                  }} className="w-4 h-4 rounded border-accent text-accent focus:ring-accent" />
                          <label htmlFor={`compare-${article.id}`} className="text-xs text-muted-foreground cursor-pointer">
                            Select for comparison
                          </label>
                        </div>
                      </div>
                    </div>;
          })}
              </div> : <div className="text-center py-12">
                <div className="text-muted-foreground text-4xl mb-3">📰</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or language filters</p>
              </div>}
          </div>
        </>) : !selectedRegion ? (/* Region Selection View */
    <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-8 h-8 text-accent" />
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
              {selectedState ? "Back to States" : `Back to ${REGIONS.find(r => r.id === selectedRegion)?.name}`}
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              {selectedState && <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-accent">
                  <StateMapCard state={currentStates.find(s => s.name === selectedState)!} onClick={() => {}} />
                </div>}
              {!selectedState && selectedCountryName && <Globe className="w-24 h-24 text-accent" />}
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {selectedState ? `${selectedState} News` : `${selectedCountryName} News`}
                </h2>
                <p className="text-muted-foreground">
                  Latest updates from {selectedState || selectedCountryName}
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
                {availableLanguages.map(lang => <LanguagePill key={lang.code} code={lang.code} name={lang.name} count={lang.count} isActive={selectedLanguage === lang.code} onClick={() => setSelectedLanguage(lang.code)} />)}
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
            return <div key={article.id} className={`rounded-2xl overflow-hidden border ${isSelected ? 'border-accent ring-2 ring-accent' : 'border-border'} bg-card transition-all`}>
                      {article.image && <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />}
                      <div className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white mb-2 flex-1">{article.title}</h3>
                          <div className="flex items-center gap-2">
                            {article.language && article.language !== userLanguage && <button onClick={() => translateArticle(article.id, article)} disabled={translating[article.id]} className="flex-shrink-0 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition disabled:opacity-50" title={`Translate to ${userLanguage.toUpperCase()}`}>
                                {translating[article.id] ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Languages className="w-4 h-4 text-accent" />}
                              </button>}
                            <ArticleBookmarkButton article={article} />
                            <button onClick={() => navigate('/compare', {
                      state: {
                        article
                      }
                    })} className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition">
                              Compare Sources
                            </button>
                          </div>
                        </div>
                        
                        {/* Article Metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {article.language && <div className="flex items-center gap-1">
                              <span className="font-medium">Language:</span>
                              <span className="uppercase">{article.language}</span>
                            </div>}
                          {article.author && <div className="flex items-center gap-1">
                              <span className="font-medium">Author:</span>
                              <span>{article.author}</span>
                            </div>}
                          {article.publish_date && <div className="flex items-center gap-1">
                              <span className="font-medium">Published:</span>
                              <span>{new Date(article.publish_date).toLocaleDateString()}</span>
                            </div>}
                          {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                              Read original →
                            </a>}
                        </div>
                        
                        {/* Sentiment Badge */}
                        <div>
                          <SentimentBadge sentiment={article.sentiment} loading={article.analysisLoading} />
                        </div>
                        
                        {/* AI Analysis Section */}
                        <div className="space-y-3 bg-secondary/50 rounded-xl p-3 border border-accent/20">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="text-xs font-semibold text-accent uppercase">AI Analysis</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Bias:</span>
                            <p className={`text-sm font-semibold ${article.bias?.includes('Left') ? 'text-blue-400' : article.bias?.includes('Right') ? 'text-red-400' : article.bias?.includes('Center') ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {article.analysisLoading ? <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded" /> : article.bias || 'Unknown'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Summary:</span>
                            <p className="text-sm text-foreground">
                              {article.analysisLoading ? <span className="space-y-1">
                                  <span className="block w-full h-3 bg-muted animate-pulse rounded" />
                                  <span className="block w-3/4 h-3 bg-muted animate-pulse rounded" />
                                </span> : article.summary || 'No summary available'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Media Ownership:</span>
                            <p className="text-sm text-foreground">
                              {article.analysisLoading ? <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded" /> : article.ownership || 'Unknown'}
                            </p>
                          </div>
                          
                          {/* Fact-Checking Section */}
                          {article.claims && article.claims.length > 0 && <div>
                              <span className="text-xs text-muted-foreground font-medium">Fact Check:</span>
                              <div className="mt-2 space-y-2">
                                {article.claims.map((claim, i) => <div key={i} className="text-xs bg-background/50 rounded-lg p-2">
                                    <div className="flex items-start gap-2">
                                      <span className={`font-bold ${claim.verification === 'verified' ? 'text-green-400' : claim.verification === 'disputed' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {claim.verification === 'verified' ? '✓' : claim.verification === 'disputed' ? '✗' : '?'}
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-foreground font-medium">{claim.text}</p>
                                        <p className="text-muted-foreground mt-1">{claim.explanation}</p>
                                      </div>
                                    </div>
                                  </div>)}
                              </div>
                            </div>}
                        </div>
                      </div>

                      {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline inline-block">
                          Read full article →
                        </a>}
                    </div>
                  </div>;
          })}
              </div> : <div className="text-center py-12">
                {!user ? <div>
                    <p className="text-muted-foreground">Please log in to view news for {selectedState || selectedCountryName}.</p>
                    <a href="/login" className="inline-block mt-4 px-4 py-2 bg-accent text-white rounded-lg">Log in</a>
                  </div> : <p className="text-muted-foreground">No news articles found for {selectedState || selectedCountryName}</p>}
              </div>}
          </div>
        </>)}

      <BottomNav />
    </div>;
};
export default Index;