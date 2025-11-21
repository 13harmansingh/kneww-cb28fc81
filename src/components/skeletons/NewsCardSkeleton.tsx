import { Card } from "@/components/ui/card";

export const NewsCardSkeleton = () => {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded-full" />
        </div>
      </div>
    </Card>
  );
};
