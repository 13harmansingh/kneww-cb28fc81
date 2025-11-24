import { Card } from '@/components/ui/card';

export function CompareViewSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2].map((i) => (
        <Card key={i} className="p-6 space-y-4">
          {/* Image */}
          <div className="aspect-video bg-muted rounded" />
          
          {/* Title */}
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-full" />
          </div>

          {/* Meta */}
          <div className="flex gap-3">
            <div className="h-5 w-20 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}
