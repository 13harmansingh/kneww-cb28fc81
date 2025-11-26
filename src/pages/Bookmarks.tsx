import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { SwipeIndicator } from "@/components/SwipeIndicator";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { ArticleItem } from "@/components/ArticleItem";
import { NewsArticle } from "@/config/types";
import { CategoryPill } from "@/components/CategoryPill";
import { LanguagePill } from "@/components/LanguagePill";
import { EmptyState } from "@/components/EmptyState";

interface Bookmark {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  article_image: string;
  bias?: string | null;
  summary?: string | null;
  ownership?: string | null;
  sentiment?: string | null;
  claims?: any;
  language?: string | null;
  country?: string | null;
  category?: string | null;
}

export default function Bookmarks() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Filter states
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  // Guard: ensure router context exists
  if (!location) return null;

  // Scroll position restoration
  useScrollRestoration({ pageKey: 'bookmarks-page', enabled: true });

  // Swipe navigation
  const { swipeProgress, swipeDirection } = useSwipeNavigation({
    enabled: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueCountries = Array.from(
    new Set(bookmarks.map(b => b.country).filter(Boolean))
  ) as string[];
  
  const uniqueLanguages = Array.from(
    new Set(bookmarks.map(b => b.language).filter(Boolean))
  ).map(code => ({ code: code as string, name: code?.toUpperCase() || '', count: 0 }));
  
  const uniqueCategories = Array.from(
    new Set(bookmarks.map(b => b.category).filter(Boolean))
  ) as string[];

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (selectedCountry !== "all" && bookmark.country !== selectedCountry) return false;
    if (selectedLanguage !== "all" && bookmark.language !== selectedLanguage) return false;
    if (selectedCategory !== "all" && bookmark.category !== selectedCategory) return false;
    return true;
  });

  // Convert bookmark to NewsArticle format
  const bookmarkToArticle = (bookmark: Bookmark): NewsArticle => ({
    id: bookmark.article_id,
    title: bookmark.article_title,
    url: bookmark.article_url,
    image: bookmark.article_image,
    bias: bookmark.bias || undefined,
    summary: bookmark.summary || undefined,
    ownership: bookmark.ownership || undefined,
    sentiment: (bookmark.sentiment as 'positive' | 'negative' | 'neutral') || undefined,
    claims: bookmark.claims ? (Array.isArray(bookmark.claims) ? bookmark.claims : []) : undefined,
    language: bookmark.language || undefined,
    text: '',
    source_country: bookmark.country || '',
    publish_date: '',
  });

  const handleTranslate = (id: string, article: NewsArticle) => {
    // Translation logic would go here
    console.log('Translate article:', id, article);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Fixed Header with Safe Area Support */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">My Bookmarks</h1>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="px-4 pt-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(4)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Fixed Header with Safe Area Support */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">My Bookmarks</h1>
        </div>
        
        {/* Filter Pills */}
        {bookmarks.length > 0 && (uniqueCountries.length > 0 || uniqueLanguages.length > 0 || uniqueCategories.length > 0) && (
          <div className="mt-4 space-y-3">
            {/* Country Filter */}
            {uniqueCountries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCountry("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCountry === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  All Countries
                </button>
                {uniqueCountries.map(country => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCountry === country
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}

            {/* Language Filter */}
            {uniqueLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLanguage("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedLanguage === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  All Languages
                </button>
                {uniqueLanguages.map(lang => (
                  <LanguagePill
                    key={lang.code}
                    code={lang.code}
                    name={lang.name}
                    count={lang.count}
                    isActive={selectedLanguage === lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                  />
                ))}
              </div>
            )}

            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  All Categories
                </button>
                {uniqueCategories.map(cat => (
                  <CategoryPill
                    key={cat}
                    label={cat}
                    isActive={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Scrollable Content */}
      <div className="px-4 pt-6">
        <div className="max-w-4xl mx-auto">
          {bookmarks.length === 0 ? (
            <EmptyState
              title="No bookmarks yet"
              description="Start saving articles by tapping the bookmark icon on any article"
            />
          ) : filteredBookmarks.length === 0 ? (
            <EmptyState
              title="No bookmarks match your filters"
              description="Try adjusting your filter selection to see more results"
            />
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="transform scale-100 hover:scale-[1.01] transition-transform">
                  <ArticleItem
                    article={bookmarkToArticle(bookmark)}
                    isSelected={false}
                    userLanguage="en"
                    translating={translating}
                    onTranslate={handleTranslate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Swipe Navigation Indicator */}
      <SwipeIndicator progress={swipeProgress} direction={swipeDirection} />
      
      <BottomNav />
    </div>
  );
}
