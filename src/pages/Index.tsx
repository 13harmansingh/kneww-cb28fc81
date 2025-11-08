import { Search, Bell, ArrowRight, MapPin, Scale, Bookmark } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill } from "@/components/CategoryPill";
import { StateMapCard } from "@/components/StateMapCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { US_STATES } from "@/data/usStates";
import { useNews, NewsArticle } from "@/hooks/useNews";
import { cn } from "@/lib/utils";

const Index = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<NewsArticle[]>([]);
  const navigate = useNavigate();

  const categories = ["All", "Politics", "Sports", "Technology", "Entertainment"];
  const { news, loading } = useNews(selectedState, selectedCategory);

  const filteredStates = US_STATES.filter((state) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={selectedState ? "Search news..." : "Search states..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-full py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button className="text-foreground">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </div>

      {!selectedState ? (
        /* State Selection View */
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-3xl font-bold text-white">Select Your State</h2>
              <p className="text-muted-foreground">Choose a state to view local news</p>
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
          {/* State Header with Mini Map */}
          <div className="px-4 mt-6">
            <button
              onClick={handleBackToStates}
              className="flex items-center gap-2 text-accent mb-4 hover:underline"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to States
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-accent">
                <StateMapCard
                  state={US_STATES.find((s) => s.name === selectedState)!}
                  onClick={() => {}}
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedState} News</h2>
                <p className="text-muted-foreground">Latest updates from {selectedState}</p>
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
            {loading ? (
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
                              onClick={() => toggleArticleForCompare(article)}
                              disabled={!isSelected && selectedForCompare.length >= 3}
                              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                isSelected 
                                  ? 'bg-accent text-white' 
                                  : selectedForCompare.length >= 3
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-accent/20 text-accent hover:bg-accent/30'
                              }`}
                            >
                              {isSelected ? '✓ Selected' : 'Compare'}
                            </button>
                          </div>
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
                <p className="text-muted-foreground">No news articles found for {selectedState}</p>
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
