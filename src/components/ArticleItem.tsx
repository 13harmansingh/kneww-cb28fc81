import { useState } from "react";
import { Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
    if (!hasAnalysis && !isAnalyzing) {
      triggerAnalysis();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-2xl overflow-hidden border ${
        isSelected ? 'border-accent ring-2 ring-accent' : 'border-border'
      } bg-card transition-all cursor-pointer hover:border-accent/50`}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onTranslate(article.id, article);
                }}
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
              onClick={(e) => e.stopPropagation()}
              className="text-accent hover:underline"
            >
              Read original →
            </a>
          )}
        </div>

        {/* AI Analysis Section - Expandable */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/50 pt-4 space-y-4">
                {/* AI Analysis Section */}
                <div className="space-y-3 bg-secondary/50 rounded-xl p-3 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs font-semibold text-accent uppercase">
                      AI Analysis
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Bias:
                      </span>
                      {isAnalyzing ? (
                        <div className="h-4 bg-muted rounded animate-pulse mt-1" />
                      ) : (
                        <p className="text-sm text-foreground mt-1">
                          {bias || "Not analyzed yet"}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Summary:
                      </span>
                      {isAnalyzing ? (
                        <div className="space-y-2 mt-1">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground mt-1">
                          {summary || "Not analyzed yet"}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Media Ownership:
                      </span>
                      {isAnalyzing ? (
                        <div className="h-4 bg-muted rounded animate-pulse mt-1" />
                      ) : (
                        <p className="text-sm text-foreground mt-1">
                          {ownership || "Not analyzed yet"}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Sentiment:
                      </span>
                      {isAnalyzing ? (
                        <div className="h-6 bg-muted rounded animate-pulse mt-1" />
                      ) : (
                        <div className="mt-1">
                          <SentimentBadge sentiment={sentiment} loading={isAnalyzing} />
                        </div>
                      )}
                    </div>

                    {/* Claims Section */}
                    {claims && claims.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/30">
                        <span className="text-xs text-muted-foreground font-medium">
                          Fact Check:
                        </span>
                        <div className="space-y-2">
                          {claims.map((claim: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-sm space-y-1 pb-2 border-b border-border/30 last:border-0 last:pb-0"
                            >
                              <p className="text-foreground italic">"{claim.text}"</p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    claim.verification === "verified"
                                      ? "bg-green-500/20 text-green-400"
                                      : claim.verification === "disputed"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {claim.verification}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs">
                                {claim.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-accent text-sm hover:underline inline-block"
          >
            Read full article →
          </a>
        )}
      </div>
    </div>
  );
};
