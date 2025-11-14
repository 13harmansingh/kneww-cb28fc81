import { Search, Bell, ArrowRight, MapPin, Scale, Bookmark, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill } from "@/components/CategoryPill";
import { StateMapCard } from "@/components/StateMapCard";
import { CountryMapCard } from "@/components/CountryMapCard";
import { RegionCard } from "@/components/RegionCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { US_STATES } from "@/data/usStates";
import { COUNTRIES, REGIONS, getCountriesByRegion } from "@/data/countries";
import { useNews, NewsArticle } from "@/hooks/useNews";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<NewsArticle[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [userLanguage, setUserLanguage] = useState("en");
  const navigate = useNavigate();

  const { user, session, loading: authLoading } = useAuth();
  const categories = ["All", "Politics", "Sports", "Technology", "Entertainment"];
  const languages = [
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
  ];
  const location = selectedState || selectedCountryName;
  const sourceCountryCode = selectedCountry || 'us';
  const { news, loading, error, retry } = useNews(location, selectedCategory, session, selectedLanguage, sourceCountryCode);

  useEffect(() => {
    const country = searchParams.get("country");
    const countryName = searchParams.get("countryName");
    if (country && countryName) {
      setSelectedCountry(country);
      setSelectedCountryName(countryName);
      // Find and set the region for this country
      const countryData = COUNTRIES.find(c => c.code === country);
      if (countryData) {
        setSelectedRegion(countryData.region);
      }
    }
  }, [searchParams]);

  // Fetch user's principal language
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("principal_language")
          .eq("id", user.id)
          .single();
        
        if (data?.principal_language) {
          setUserLanguage(data.principal_language);
          setSelectedLanguage(data.principal_language);
        }
      }
    };
    fetchUserLanguage();
  }, [user]);

  const filteredRegions = REGIONS.filter((region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = selectedRegion 
    ? getCountriesByRegion(selectedRegion).filter((country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredStates = US_STATES.filter((state) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setSearchQuery("");
  };

  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setSelectedCountry(countryCode);
    setSelectedCountryName(countryName);
    // If country has states (only US for now), don't fetch news yet
    if (countryCode === "US") {
      return;
    }
  };

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
  };

  const handleBackToRegions = () => {
    setSelectedRegion(null);
    setSelectedCountry(null);
    setSelectedCountryName(null);
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedForCompare([]);
    navigate("/");
  };

  const handleBackToCountries = () => {
    setSelectedCountry(null);
    setSelectedCountryName(null);
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedForCompare([]);
  };

  const handleBackToStates = () => {
    setSelectedState(null);
    setSelectedCategory("all");
    setSelectedForCompare([]);
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
    navigate("/compare", { state: { articles: selectedForCompare } });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-24">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-3">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please log in to view news articles and explore global news coverage.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition"
          >
            Go to Login
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                selectedState 
                  ? "Search news..." 
                  : selectedCountry 
                  ? "Search states..." 
                  : selectedRegion
                  ? "Search countries..."
                  : "Search regions..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-full py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button className="text-foreground">
            <Bell className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">KNEW</h1>
          <span className="text-xs text-muted-foreground">Global News Platform</span>
        </div>
      </div>

      {!selectedRegion ? (
        /* Region Selection View */
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">Select Your Region</h2>
              <p className="text-muted-foreground">Choose a region to explore countries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                onClick={() => handleRegionSelect(region.id)}
              />
            ))}
          </div>
        </div>
      ) : !selectedCountry ? (
        /* Country Selection View */
        <div className="px-4 mt-6">
          <button
            onClick={handleBackToRegions}
            className="flex items-center gap-2 text-accent mb-4 hover:underline"
          >
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
            {filteredCountries.map((country) => (
              <CountryMapCard
                key={country.code}
                country={country}
                onClick={() => handleCountrySelect(country.code, country.name)}
              />
            ))}
          </div>
        </div>
      ) : selectedCountry === "US" && !selectedState ? (
        /* US State Selection View */
        <div className="px-4 mt-6">
          <button
            onClick={handleBackToCountries}
            className="flex items-center gap-2 text-accent mb-4 hover:underline"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to {REGIONS.find(r => r.id === selectedRegion)?.name}
          </button>
          
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">Select Your State</h2>
              <p className="text-muted-foreground">Choose a US state to view local news</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map((state) => (
              <StateMapCard
                key={state.code}
                state={state}
                onClick={() => handleStateSelect(state.name)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* News View */
        <>
          {/* Location Header */}
          <div className="px-4 mt-6">
            <button
              onClick={selectedState ? handleBackToStates : handleBackToCountries}
              className="flex items-center gap-2 text-accent mb-4 hover:underline"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              {selectedState ? "Back to States" : `Back to ${REGIONS.find(r => r.id === selectedRegion)?.name}`}
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              {selectedState && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-accent">
                  <StateMapCard
                    state={US_STATES.find((s) => s.name === selectedState)!}
                    onClick={() => {}}
                  />
                </div>
              )}
              {!selectedState && selectedCountryName && (
                <Globe className="w-24 h-24 text-accent" />
              )}
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
              {categories.map((category) => (
                <CategoryPill
                  key={category}
                  label={category}
                  isActive={selectedCategory === category.toLowerCase()}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                />
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Language</h2>
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {languages.map((lang) => (
                  <CategoryPill
                    key={lang.code}
                    label={lang.name}
                    isActive={selectedLanguage === lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Compare Bar */}
          {selectedForCompare.length > 0 && (
            <div className="fixed bottom-24 left-0 right-0 z-20 px-4">
              <div className="bg-accent/90 backdrop-blur rounded-2xl p-4 border border-accent shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">
                      {selectedForCompare.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedForCompare([])}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition"
                    >
                      Clear
                    </button>
                    {selectedForCompare.length >= 2 && (
                      <button
                        onClick={handleCompare}
                        className="px-4 py-2 bg-white text-accent rounded-lg text-sm font-semibold hover:bg-white/90 transition"
                      >
                        Compare
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* News Feed */}
          <div className="px-4 mt-6">
            {error ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                  <div className="text-destructive text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load News</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={retry}
                    className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading news...</p>
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {news.map((article) => {
                  const isSelected = selectedForCompare.find(a => a.id === article.id);
                  return (
                    <div 
                      key={article.id} 
                      className={`rounded-2xl overflow-hidden border ${
                        isSelected ? 'border-accent ring-2 ring-accent' : 'border-border'
                      } bg-card transition-all`}
                    >
                      {article.image && (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white mb-2 flex-1">{article.title}</h3>
                          <div className="flex items-center gap-2">
                            <ArticleBookmarkButton article={article} />
                            <button
                              onClick={() => navigate('/compare', { state: { article } })}
                              className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition"
                            >
                              Compare Sources
                            </button>
                          </div>
                        </div>
                        
                        {/* Article Metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Author:</span>
                              <span>{article.author}</span>
                            </div>
                          )}
                          {article.publish_date && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Published:</span>
                              <span>{new Date(article.publish_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {article.url && (
                            <a 
                              href={article.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              Read original →
                            </a>
                          )}
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
                            <p className={`text-sm font-semibold ${
                              article.bias?.includes('Left') ? 'text-blue-400' : 
                              article.bias?.includes('Right') ? 'text-red-400' : 
                              article.bias?.includes('Center') ? 'text-green-400' : 
                              'text-muted-foreground'
                            }`}>
                              {article.analysisLoading ? (
                                <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded" />
                              ) : (
                                article.bias || 'Unknown'
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Summary:</span>
                            <p className="text-sm text-foreground">
                              {article.analysisLoading ? (
                                <span className="space-y-1">
                                  <span className="block w-full h-3 bg-muted animate-pulse rounded" />
                                  <span className="block w-3/4 h-3 bg-muted animate-pulse rounded" />
                                </span>
                              ) : (
                                article.summary || 'No summary available'
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Media Ownership:</span>
                            <p className="text-sm text-foreground">
                              {article.analysisLoading ? (
                                <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded" />
                              ) : (
                                article.ownership || 'Unknown'
                              )}
                            </p>
                          </div>
                          
                          {/* Fact-Checking Section */}
                          {article.claims && article.claims.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground font-medium">Fact Check:</span>
                              <div className="mt-2 space-y-2">
                                {article.claims.map((claim, i) => (
                                  <div key={i} className="text-xs bg-background/50 rounded-lg p-2">
                                    <div className="flex items-start gap-2">
                                      <span className={`font-bold ${
                                        claim.verification === 'verified' ? 'text-green-400' :
                                        claim.verification === 'disputed' ? 'text-red-400' :
                                        'text-yellow-400'
                                      }`}>
                                        {claim.verification === 'verified' ? '✓' :
                                         claim.verification === 'disputed' ? '✗' : '?'}
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-foreground font-medium">{claim.text}</p>
                                        <p className="text-muted-foreground mt-1">{claim.explanation}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-sm hover:underline inline-block"
                        >
                          Read full article →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-12">
                {!user ? (
                  <div>
                    <p className="text-muted-foreground">Please log in to view news for {selectedState || selectedCountryName}.</p>
                    <a href="/login" className="inline-block mt-4 px-4 py-2 bg-accent text-white rounded-lg">Log in</a>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No news articles found for {selectedState || selectedCountryName}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
