export const RegionCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-lg animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-32 bg-muted rounded" />
      </div>
    </div>
  );
};
