import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Follow {
  id: string;
  follow_type: 'state' | 'topic';
  value: string;
}

interface FollowedTopicsBarProps {
  follows: Follow[];
  onRemove: (id: string) => void;
}

export const FollowedTopicsBar = ({ follows, onRemove }: FollowedTopicsBarProps) => {
  if (follows.length === 0) return null;

  return (
    <div className="border-b border-border/50 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Following</h3>
        <Badge variant="secondary" className="text-xs">
          {follows.length}
        </Badge>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {follows.map((follow) => (
            <Badge
              key={follow.id}
              variant="outline"
              className="flex items-center gap-2 pr-1 whitespace-nowrap"
            >
              <span className="text-xs">
                {follow.follow_type === 'state' ? '📍' : '📰'} {follow.value}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => onRemove(follow.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
