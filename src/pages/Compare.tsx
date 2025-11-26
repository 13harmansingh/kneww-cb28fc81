import { ArrowLeft, Scale, Loader2, Languages } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { NewsArticle } from "@/config/types";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const article = location.state?.article as NewsArticle | undefined;
  const { session } = useAuth();
  
  // Guard: ensure router context exists
  if (!location) return null;
  
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  useEffect(() => {
    if (!article) {
      return;
    }

    fetchRelatedNews();
  }, [article]);

  const fetchRelatedNews = async () => {
    if (!article || !session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-related-news", {
        body: { 
          topic: article.title,
          language: 'en',
          source_country: 'us,gb,ca,au,in'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.news) {
        // Analyze each article
        const articlesWithAnalysis = data.news.map((item: NewsArticle) => ({
          ...item,
          analysisLoading: true,
          bias: 'Analyzing...',
          sentiment: 'neutral' as const,
        }));
        
        setRelatedArticles(articlesWithAnalysis);

        // Analyze articles in parallel
        articlesWithAnalysis.forEach(async (item: NewsArticle, index: number) => {
          try {
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-news', {
              body: { 
                title: item.title,
                text: item.text,
                url: item.url
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (!analysisError && analysisData) {
              setRelatedArticles(prev => prev.map((a, i) => 
                i === index 
                  ? { ...a, ...analysisData, analysisLoading: false }
                  : a
              ));
            }
          } catch (err) {
            console.error('Error analyzing article:', err);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching related news:", error);
      toast.error("Failed to load related articles");
    } finally {
      setLoading(false);
    }
  };

  const translateArticle = async (articleToTranslate: NewsArticle, targetLang: string) => {
    if (!session) return;

    setTranslating(articleToTranslate.id);
    try {
      const { data, error } = await supabase.functions.invoke("translate-article", {
        body: {
          title: articleToTranslate.title,
          text: articleToTranslate.text,
          summary: articleToTranslate.summary,
          targetLanguage: targetLang,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setRelatedArticles(prev => prev.map(a => 
        a.id === articleToTranslate.id
          ? { ...a, ...data, translated: true }
          : a
      ));

      toast.success("Article translated successfully");
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate article");
    } finally {
      setTranslating(null);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please select an article to compare</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-accent hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const getBiasColor = (bias?: string) => {
    if (!bias || bias === 'Analyzing...') return 'bg-secondary/50';
    if (bias.toLowerCase().includes('left')) return 'bg-blue-500/20 border-blue-500/50';
    if (bias.toLowerCase().includes('right')) return 'bg-red-500/20 border-red-500/50';
    if (bias.toLowerCase().includes('center')) return 'bg-green-500/20 border-green-500/50';
    return 'bg-secondary/50';
  };

  const getBiasPosition = (bias?: string): 'left' | 'center' | 'right' => {
    if (!bias) return 'center';
    const lowerBias = bias.toLowerCase();
    if (lowerBias.includes('left')) return 'left';
    if (lowerBias.includes('right')) return 'right';
    return 'center';
  };

  const groupedArticles = {
    left: relatedArticles.filter(a => getBiasPosition(a.bias) === 'left'),
    center: relatedArticles.filter(a => getBiasPosition(a.bias) === 'center'),
    right: relatedArticles.filter(a => getBiasPosition(a.bias) === 'right'),
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Scale className="w-6 h-6 text-accent" />
            <div>
              <h1 className="text-xl font-bold text-white">Coverage Analysis</h1>
              <p className="text-xs text-muted-foreground">Multiple perspectives on: {article.title.substring(0, 60)}...</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 mt-6 space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 animate-pulse">
              <div className="h-6 bg-muted rounded w-20 mx-auto" />
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 animate-pulse">
              <div className="h-6 bg-muted rounded w-20 mx-auto" />
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
              <div className="h-6 bg-muted rounded w-20 mx-auto" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, colIdx) => (
              <div key={colIdx} className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <NewsCardSkeleton key={i} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 mt-6 space-y-6">
          {/* Political Spectrum Header */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h3 className="font-bold text-blue-400">Left ({groupedArticles.left.length})</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <h3 className="font-bold text-green-400">Center ({groupedArticles.center.length})</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <h3 className="font-bold text-red-400">Right ({groupedArticles.right.length})</h3>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {groupedArticles.left.map((art) => (
                <ArticleCard 
                  key={art.id} 
                  article={art} 
                  onTranslate={translateArticle}
                  translating={translating === art.id}
                />
              ))}
              {groupedArticles.left.length === 0 && (
                <div className="p-6 rounded-xl border border-border bg-card/50 text-center text-muted-foreground">
                  No left-leaning sources found
                </div>
              )}
            </div>

            {/* Center Column */}
            <div className="space-y-4">
              {groupedArticles.center.map((art) => (
                <ArticleCard 
                  key={art.id} 
                  article={art} 
                  onTranslate={translateArticle}
                  translating={translating === art.id}
                />
              ))}
              {groupedArticles.center.length === 0 && (
                <div className="p-6 rounded-xl border border-border bg-card/50 text-center text-muted-foreground">
                  No centrist sources found
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {groupedArticles.right.map((art) => (
                <ArticleCard 
                  key={art.id} 
                  article={art} 
                  onTranslate={translateArticle}
                  translating={translating === art.id}
                />
              ))}
              {groupedArticles.right.length === 0 && (
                <div className="p-6 rounded-xl border border-border bg-card/50 text-center text-muted-foreground">
                  No right-leaning sources found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleCard({ 
  article, 
  onTranslate, 
  translating 
}: { 
  article: NewsArticle; 
  onTranslate: (article: NewsArticle, lang: string) => void;
  translating: boolean;
}) {
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  const getBiasColor = (bias?: string) => {
    if (!bias || bias === 'Analyzing...') return 'bg-secondary/50';
    if (bias.toLowerCase().includes('left')) return 'bg-blue-500/20 border-blue-500/50';
    if (bias.toLowerCase().includes('right')) return 'bg-red-500/20 border-red-500/50';
    if (bias.toLowerCase().includes('center')) return 'bg-green-500/20 border-green-500/50';
    return 'bg-secondary/50';
  };

  const languages = [
    { code: "pt", name: "Português" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
  ];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${getBiasColor(article.bias)}`}>
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-32 object-cover rounded-lg"
        />
      )}
      
      <h3 className="font-bold text-white text-sm line-clamp-3">{article.title}</h3>
      
      {article.source_country && (
        <div className="text-xs text-muted-foreground">
          Source: {article.source_country.toUpperCase()}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-background/50 text-foreground">
          {article.bias || 'Unknown'}
        </span>
        <span className="px-2 py-1 rounded-full bg-background/50 text-foreground">
          {article.sentiment || 'neutral'}
        </span>
      </div>

      {article.summary && (
        <p className="text-xs text-foreground/80 line-clamp-3">{article.summary}</p>
      )}

      <div className="flex gap-2">
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Read original →
          </a>
        )}
        
        <div className="relative ml-auto">
          <button
            onClick={() => setShowTranslateMenu(!showTranslateMenu)}
            disabled={translating}
            className="text-xs flex items-center gap-1 text-accent hover:underline disabled:opacity-50"
          >
            {translating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="w-3 h-3" />
                Translate
              </>
            )}
          </button>
          
          {showTranslateMenu && !translating && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg p-2 z-10 min-w-[120px]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onTranslate(article, lang.code);
                    setShowTranslateMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-accent/10 rounded"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
