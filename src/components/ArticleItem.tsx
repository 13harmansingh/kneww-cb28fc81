import { Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ArticleBookmarkButton } from "@/components/ArticleBookmarkButton";
import { NewsArticle } from "@/hooks/useNews";
import { useLazyAnalysis } from "@/hooks/useLazyAnalysis";

interface ArticleItemProps {
  article: NewsArticle;
  isSelected: boolean;
  userLanguage: string;
  translating: Record<string, boolean>;
  onTranslate: (id: string, article: NewsArticle) => void;
}

export const ArticleItem = ({
  article,
  isSelected,
  userLanguage,
  translating,
  onTranslate,
}: ArticleItemProps) => {
  const navigate = useNavigate();
  
  // On-demand AI analysis - triggers when user clicks
  const { analysis, triggerAnalysis, isAnalyzing, hasAnalysis } = useLazyAnalysis(
    article.id,
    article.url || article.id,
    article.title,
    article.text
  );

  // Use analysis results, falling back to article props
  const bias = analysis.bias || article.bias;
  const summary = analysis.summary || article.summary;
  const ownership = analysis.ownership || article.ownership;
  const sentiment = (analysis.sentiment || article.sentiment) as 'positive' | 'negative' | 'neutral' | undefined;
  const claims = analysis.claims || article.claims;

  return (
    <div
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
          <h3 className="text-lg font-semibold text-white mb-2 flex-1">
            {article.title}
          </h3>
          <div className="flex items-center gap-2">
            {article.language && article.language !== userLanguage && (
              <button
                onClick={() => onTranslate(article.id, article)}
                disabled={translating[article.id]}
                className="flex-shrink-0 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition disabled:opacity-50"
                title={`Translate to ${userLanguage.toUpperCase()}`}
              >
                {translating[article.id] ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Languages className="w-4 h-4 text-accent" />
                )}
              </button>
            )}
            <ArticleBookmarkButton article={article} />
            <button
              onClick={() =>
                navigate('/compare', {
                  state: { article },
                })
              }
              className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition"
            >
              Compare Sources
            </button>
          </div>
        </div>

        {/* Article Metadata */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {article.language && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Language:</span>
              <span className="uppercase">{article.language}</span>
            </div>
          )}
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
          <SentimentBadge sentiment={sentiment} loading={isAnalyzing} />
        </div>

        {/* AI Analysis Section */}
        <div className="space-y-3 bg-secondary/50 rounded-xl p-3 border border-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-accent uppercase">
                AI Analysis
              </span>
            </div>
            {!hasAnalysis && !isAnalyzing && (
              <button
                onClick={triggerAnalysis}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-accent/20 text-accent hover:bg-accent/30 transition"
              >
                Analyze Now
              </button>
            )}
          </div>

          {!hasAnalysis && !isAnalyzing ? (
            <p className="text-sm text-muted-foreground italic">
              Click "Analyze Now" to see AI-powered bias detection, fact-checking, and summary
            </p>
          ) : (
            <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Bias:
              </span>
              <p
                className={`text-sm font-semibold ${
                  bias?.includes('Left')
                    ? 'text-blue-400'
                    : bias?.includes('Right')
                    ? 'text-red-400'
                    : bias?.includes('Center')
                    ? 'text-green-400'
                    : 'text-muted-foreground'
                }`}
              >
                {isAnalyzing ? (
                  <span className="inline-block w-16 h-4 bg-muted animate-pulse rounded" />
                ) : (
                  bias || 'Unknown'
                )}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Summary:
              </span>
              <p className="text-sm text-foreground">
                {isAnalyzing ? (
                  <span className="space-y-1">
                    <span className="block w-full h-3 bg-muted animate-pulse rounded" />
                    <span className="block w-3/4 h-3 bg-muted animate-pulse rounded" />
                  </span>
                ) : (
                  summary || 'No summary available'
                )}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Media Ownership:
              </span>
              <p className="text-sm text-foreground">
                {isAnalyzing ? (
                  <span className="inline-block w-24 h-4 bg-muted animate-pulse rounded" />
                ) : (
                  ownership || 'Unknown'
                )}
              </p>
            </div>

            {/* Fact-Checking Section */}
            {claims && claims.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">
                  Fact Check:
                </span>
                <div className="mt-2 space-y-2">
                  {claims.map((claim, i) => (
                    <div
                      key={i}
                      className="text-xs bg-background/50 rounded-lg p-2"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`font-bold ${
                            claim.verification === 'verified'
                              ? 'text-green-400'
                              : claim.verification === 'disputed'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {claim.verification === 'verified'
                            ? '✓'
                            : claim.verification === 'disputed'
                            ? '✗'
                            : '?'}
                        </span>
                        <div className="flex-1">
                          <p className="text-foreground font-medium">
                            {claim.text}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            {claim.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
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
};
