import { ArrowLeft, Bookmark, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useArticleBookmark } from "@/hooks/useArticleBookmark";
import { SentimentBadge } from "@/components/SentimentBadge";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

interface ArticleData {
  id: string;
  title: string;
  image?: string;
  url?: string;
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: string;
  claims?: any[];
}

export default function Article() {
  const location = useLocation();
  const navigate = useNavigate();
  const articleData = location.state?.article as ArticleData;

  // Guard: ensure router context exists
  if (!location) return null;

  // Scroll position restoration
  useScrollRestoration({ pageKey: `article-${articleData?.id || 'unknown'}`, enabled: !!articleData });

  if (!articleData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Article not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-accent hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { isBookmarked, loading, toggleBookmark } = useArticleBookmark({
    id: articleData.id,
    title: articleData.title,
    image: articleData.image,
    url: articleData.url || articleData.id,
    bias: articleData.bias,
    summary: articleData.summary,
    ownership: articleData.ownership,
    sentiment: articleData.sentiment as any,
    claims: articleData.claims,
  } as any);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-foreground hover:text-accent transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleBookmark}
              disabled={loading}
              className="text-foreground hover:text-accent transition"
            >
              <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-accent text-accent' : ''}`} />
            </button>
            {articleData.url && (
              <a
                href={articleData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-accent transition"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          {articleData.title}
        </h1>

        {/* Image */}
        {articleData.image && (
          <div className="rounded-2xl overflow-hidden bg-muted">
            <img
              src={articleData.image}
              alt={articleData.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* AI Analysis Section */}
        {(articleData.summary || articleData.bias || articleData.ownership || articleData.sentiment) && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <span className="text-accent">✨</span>
              AI Analysis
            </h2>

            {/* Summary */}
            {articleData.summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Summary</h3>
                <p className="text-foreground leading-relaxed">{articleData.summary}</p>
              </div>
            )}

            {/* Badges Row */}
            <div className="flex flex-wrap gap-3">
              {articleData.sentiment && (
                <SentimentBadge sentiment={articleData.sentiment as any} />
              )}
              {articleData.bias && (
                <Badge variant="outline" className="text-sm">
                  <span className="font-semibold">Bias:</span> {articleData.bias}
                </Badge>
              )}
              {articleData.ownership && (
                <Badge variant="outline" className="text-sm">
                  <span className="font-semibold">Ownership:</span> {articleData.ownership}
                </Badge>
              )}
            </div>

            {/* Claims */}
            {articleData.claims && articleData.claims.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Key Claims</h3>
                <div className="space-y-3">
                  {articleData.claims.map((claim: any, index: number) => (
                    <div key={index} className="bg-background/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <Badge 
                          variant={
                            claim.verification === 'verified' ? 'default' :
                            claim.verification === 'false' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {claim.verification}
                        </Badge>
                        <p className="flex-1 text-foreground font-medium">{claim.text}</p>
                      </div>
                      {claim.explanation && (
                        <p className="text-sm text-muted-foreground pl-16">
                          {claim.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Original Article Link */}
        {articleData.url && (
          <div className="text-center pt-6">
            <a
              href={articleData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent/80 transition"
            >
              Read Full Article
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
