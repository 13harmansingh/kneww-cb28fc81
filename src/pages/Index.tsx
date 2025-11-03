import { Search, Bell, ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill } from "@/components/CategoryPill";
import { StateMapCard } from "@/components/StateMapCard";
import { US_STATES } from "@/data/usStates";
import { useNews } from "@/hooks/useNews";

const Index = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

          {/* News Feed */}
          <div className="px-4 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading news...</p>
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {news.map((article) => (
                  <div key={article.id} className="rounded-2xl overflow-hidden border border-border bg-card">
                    {article.image && (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                      {article.text && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                          {article.text}
                        </p>
                      )}
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-sm hover:underline"
                        >
                          Read more →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
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
