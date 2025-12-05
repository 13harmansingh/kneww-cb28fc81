import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { ArticleItem } from "@/components/ArticleItem";
import { CategoryPill } from "@/components/CategoryPill";
import { LanguagePill } from "@/components/LanguagePill";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useNews } from "@/hooks/useNews";
import { useTranslate } from "@/hooks/useTranslate";
import { NewsArticle } from "@/config/types";
import { toast } from "sonner";
import { ArrowLeft, Globe } from "lucide-react";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Politics", value: "politics" },
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Sports", value: "sports" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Health", value: "health" },
  { label: "Science", value: "science" },
];

const Explore = () => {
  const location = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { session } = useAuth();
  const { theme } = useTheme();
  
  // State for country selection and news display
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCountryName, setSelectedCountryName] = useState<string>("");
  const [showNews, setShowNews] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Translation state
  const { translate, translating, error: translateError } = useTranslate();
  const [translatedNews, setTranslatedNews] = useState<Record<string, NewsArticle>>({});

  // Fetch news using the useNews hook
  const { news, availableLanguages, defaultLanguage, loading, error, retry } = useNews(
    selectedCountryName,
    selectedCategory === "all" ? "" : selectedCategory,
    session,
    selectedLanguage === "all" ? undefined : selectedLanguage,
    selectedCountry?.toLowerCase()
  );

  // Guard: ensure router context exists
  if (!location) return null;

  useEffect(() => {
    if (!mapContainer.current || showNews) return;

    // If map already exists and theme changed, update the style
    if (map.current) {
      const newStyle = theme === 'light' 
        ? "mapbox://styles/mapbox/light-v11" 
        : "mapbox://styles/mapbox/dark-v11";
      map.current.setStyle(newStyle);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapStyle = theme === 'light' 
      ? "mapbox://styles/mapbox/light-v11" 
      : "mapbox://styles/mapbox/dark-v11";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      projection: "globe",
      zoom: 1.5,
      center: [0, 20],
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.current.on("style.load", () => {
      if (theme === 'dark') {
        map.current?.setFog({
          color: "rgb(25, 25, 40)",
          "high-color": "rgb(50, 50, 80)",
          "horizon-blend": 0.2,
        });
      }
    });

    // Add click handler for reverse geocoding
    map.current.on("click", async (e) => {
      setIsLoadingMap(true);
      const { lng, lat } = e.lngLat;

      try {
        // Reverse geocoding using Mapbox API
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=country`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const country = data.features[0];
          const countryName = country.text;
          const countryCode = country.properties?.short_code?.toUpperCase();

          // Add a marker at the clicked location
          new mapboxgl.Marker({ color: "#9b87f5" })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<div class="p-2"><strong>${countryName}</strong></div>`
              )
            )
            .addTo(map.current!);

          // Set state to show news for this country
          toast.success(`Curating stories from ${countryName}...`);
          setSelectedCountry(countryCode);
          setSelectedCountryName(countryName);
          setShowNews(true);
        }
      } catch (error) {
        console.error("Error with reverse geocoding:", error);
        toast.error("Could not identify location. Please try again.");
      } finally {
        setIsLoadingMap(false);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [showNews, theme]);

  const handleBackToMap = () => {
    setShowNews(false);
    setSelectedCountry("");
    setSelectedCountryName("");
    setSelectedLanguage("all");
    setSelectedCategory("all");
    setTranslatedNews({});
  };

  const handleTranslateArticle = async (id: string, article: NewsArticle) => {
    if (!session?.user) {
      toast.error("Please sign in to translate articles");
      return;
    }

    const userLang = selectedLanguage === "all" ? defaultLanguage : selectedLanguage;
    
    if (article.language === userLang) {
      toast.info("Article is already in your selected language");
      return;
    }

    const translated = await translate(article, userLang);
    if (translated) {
      setTranslatedNews(prev => ({
        ...prev,
        [id]: translated
      }));
      toast.success("Content localized successfully");
    } else if (translateError) {
      toast.error(translateError);
    }
  };

  // Get display news (translated or original)
  const displayNews = news.map(article => 
    translatedNews[article.id] || article
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3 mb-2">
          {showNews && (
            <button
              onClick={handleBackToMap}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
              aria-label="Back to map"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <Globe className="w-6 h-6 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">
            {showNews ? selectedCountryName : "Explore World News"}
          </h1>
        </div>
        {!showNews && (
          <p className="text-muted-foreground">Tap anywhere to unveil regional intelligence</p>
        )}
      </div>

      {showNews ? (
        <div className="px-4 mt-6 space-y-6">
          {/* Language Filter */}
          {availableLanguages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Filter by Language</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <LanguagePill
                  code="all"
                  name="All Languages"
                  count={news.length}
                  isActive={selectedLanguage === "all"}
                  onClick={() => setSelectedLanguage("all")}
                />
                {availableLanguages.map((lang) => (
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
            </div>
          )}

          {/* Category Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Filter by Category</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.value}
                  label={cat.label}
                  isActive={selectedCategory === cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                />
              ))}
            </div>
          </div>

          {/* News Articles */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={retry}
                className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : displayNews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found for {selectedCountryName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayNews.map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  isSelected={false}
                  userLanguage={selectedLanguage === "all" ? defaultLanguage : selectedLanguage}
                  translating={translating}
                  onTranslate={handleTranslateArticle}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-[calc(100vh-200px)] mx-4 mt-6 rounded-2xl overflow-hidden border border-border">
          <div ref={mapContainer} className="absolute inset-0" />
          {isLoadingMap && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-foreground">Discovering your destination...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Explore;
