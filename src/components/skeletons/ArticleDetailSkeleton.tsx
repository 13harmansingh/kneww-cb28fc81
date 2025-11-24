export function ArticleDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header image */}
      <div className="aspect-video bg-muted rounded-lg" />
      
      {/* Title */}
      <div className="space-y-3">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded w-full" />
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-5 w-28 bg-muted rounded" />
      </div>

      {/* Content */}
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>

      {/* Analysis section */}
      <div className="space-y-4 pt-6">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}
