interface SentimentBadgeProps {
  sentiment?: "positive" | "negative" | "neutral";
  loading?: boolean;
}

export const SentimentBadge = ({ sentiment, loading }: SentimentBadgeProps) => {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted animate-pulse">
        <span className="w-4 h-4 bg-muted-foreground/20 rounded-full" />
        <span className="w-16 h-3 bg-muted-foreground/20 rounded" />
      </div>
    );
  }

  const getConfig = () => {
    switch (sentiment) {
      case "positive":
        return {
          emoji: "😊",
          label: "Positive",
          bgColor: "bg-green-500/10",
          textColor: "text-green-600 dark:text-green-400",
          borderColor: "border-green-500/20",
        };
      case "negative":
        return {
          emoji: "😔",
          label: "Negative",
          bgColor: "bg-red-500/10",
          textColor: "text-red-600 dark:text-red-400",
          borderColor: "border-red-500/20",
        };
      case "neutral":
      default:
        return {
          emoji: "😐",
          label: "Neutral",
          bgColor: "bg-yellow-500/10",
          textColor: "text-yellow-600 dark:text-yellow-400",
          borderColor: "border-yellow-500/20",
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}
    >
      <span className="text-base">{config.emoji}</span>
      <span className={`text-xs font-semibold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
};
