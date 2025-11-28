import { useFollowManager } from '@/hooks/useFollowManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Heart, MapPin, Tag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

export const FollowingPanel = () => {
  const { follows, loading, unfollowById, syncing } = useFollowManager();

  const stateFollows = follows.filter(f => f.follow_type === 'state');
  const topicFollows = follows.filter(f => f.follow_type === 'topic');

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Gathering your curated interests...</span>
        </div>
      </Card>
    );
  }

  if (follows.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Follows Yet
            </h3>
            <p className="text-muted-foreground">
              Start following states and topics to personalize your news feed
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h2 className="text-2xl font-bold text-foreground">Following</h2>
        </div>
        <Badge variant="secondary" className="text-sm">
          {follows.length} total
        </Badge>
      </div>

      {/* States Section */}
      {stateFollows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              States & Locations
            </h3>
            <Badge variant="outline" className="text-xs">
              {stateFollows.length}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {stateFollows.map((follow) => (
                <motion.div
                  key={follow.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 pl-3 pr-2 py-2 text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{follow.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
                      onClick={() => unfollowById(follow.id)}
                      disabled={syncing}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Separator */}
      {stateFollows.length > 0 && topicFollows.length > 0 && (
        <Separator />
      )}

      {/* Topics Section */}
      {topicFollows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Topics & Categories
            </h3>
            <Badge variant="outline" className="text-xs">
              {topicFollows.length}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {topicFollows.map((follow) => (
                <motion.div
                  key={follow.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 pl-3 pr-2 py-2 text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    <span className="capitalize">{follow.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
                      onClick={() => unfollowById(follow.id)}
                      disabled={syncing}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
};
