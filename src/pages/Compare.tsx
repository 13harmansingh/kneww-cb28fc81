import { ArrowLeft, Scale } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { NewsArticle } from "@/hooks/useNews";

export default function Compare() {
  const navigate = useNavigate();
  const location = useLocation();
  const articles = (location.state?.articles || []) as NewsArticle[];

  if (articles.length < 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please select at least 2 articles to compare</p>
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

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "text-green-400";
      case "negative": return "text-red-400";
      case "neutral": return "text-yellow-400";
      default: return "text-muted-foreground";
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "😊";
      case "negative": return "😔";
      case "neutral": return "😐";
      default: return "❓";
    }
  };

  const getBiasColor = (bias?: string) => {
    if (bias?.includes('Left')) return 'text-blue-400';
    if (bias?.includes('Right')) return 'text-red-400';
    if (bias?.includes('Center')) return 'text-green-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold text-white">Article Comparison</h1>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((article, idx) => (
            <div key={article.id} className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{article.title}</h2>
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4 bg-secondary/50 rounded-xl p-4 border border-accent/20">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Political Bias:</span>
                  <p className={`text-lg font-bold ${getBiasColor(article.bias)}`}>
                    {article.bias || 'Unknown'}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-medium">Sentiment:</span>
                  <p className={`text-lg font-bold ${getSentimentColor(article.sentiment)}`}>
                    {getSentimentEmoji(article.sentiment)} {article.sentiment || 'neutral'}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-medium">Summary:</span>
                  <p className="text-sm text-foreground mt-1">{article.summary || 'No summary available'}</p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-medium">Media Ownership:</span>
                  <p className="text-sm text-foreground">{article.ownership || 'Unknown'}</p>
                </div>

                {article.claims && article.claims.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Key Claims:</span>
                    <div className="mt-2 space-y-2">
                      {article.claims.map((claim, i) => (
                        <div key={i} className="text-sm bg-background/50 rounded-lg p-2">
                          <div className="flex items-start gap-2">
                            <span className={`text-xs font-bold ${
                              claim.verification === 'verified' ? 'text-green-400' :
                              claim.verification === 'disputed' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {claim.verification === 'verified' ? '✓' :
                               claim.verification === 'disputed' ? '✗' : '?'}
                            </span>
                            <div className="flex-1">
                              <p className="text-foreground">{claim.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">{claim.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
          ))}
        </div>

        {articles.length >= 2 && (
          <div className="rounded-2xl border border-accent bg-accent/5 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" />
              Comparison Insights
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Bias Difference: </span>
                <span className="text-foreground font-medium">
                  {articles[0].bias} vs {articles[1].bias}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Sentiment Difference: </span>
                <span className="text-foreground font-medium">
                  {getSentimentEmoji(articles[0].sentiment)} {articles[0].sentiment} vs{" "}
                  {getSentimentEmoji(articles[1].sentiment)} {articles[1].sentiment}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Coverage: </span>
                <span className="text-foreground">
                  These sources provide different perspectives on the same story, 
                  allowing you to form a more balanced understanding.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
