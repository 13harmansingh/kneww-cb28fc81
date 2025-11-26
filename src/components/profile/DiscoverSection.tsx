import { Compass, TrendingUp, MapPin } from "lucide-react";
import { FollowTopicButton } from "@/components/follow/FollowTopicButton";
import { FollowStateButton } from "@/components/follow/FollowStateButton";
import { motion } from "framer-motion";

const TRENDING_TOPICS = [
  "politics",
  "technology",
  "business",
  "sports",
  "entertainment",
  "health",
  "science",
  "environment",
];

const POPULAR_LOCATIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
];

export const DiscoverSection = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Discover</h2>
      </div>

      {/* Trending Topics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Trending Topics
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TOPICS.map((topic, index) => (
            <motion.div
              key={topic}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <FollowTopicButton
                topic={topic}
                variant="outline"
                size="sm"
                showIcon={true}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Popular Locations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Popular Locations
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LOCATIONS.map((location, index) => (
            <motion.div
              key={location.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <FollowStateButton
                stateCode={location.code}
                stateName={location.name}
                variant="outline"
                size="sm"
                showIcon={true}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Follow topics and locations to personalize your news feed
      </p>
    </div>
  );
};
