import { motion } from "framer-motion";
import { useFollowManager } from "@/hooks/useFollowManager";
import { Check, Plus } from "lucide-react";

interface TrendingTopic {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface TrendingTopicCardProps {
  topic: TrendingTopic;
}

export const TrendingTopicCard = ({ topic }: TrendingTopicCardProps) => {
  const { isFollowing, toggleFollow, syncing } = useFollowManager();
  const following = isFollowing('topic', topic.id);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFollow('topic', topic.id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3 transition-all hover:border-accent/50"
    >
      <div className="text-4xl">{topic.icon}</div>
      <div>
        <h3 className="text-base font-semibold text-white">{topic.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
      </div>
      
      <motion.button
        onClick={handleFollow}
        disabled={syncing}
        whileTap={{ scale: 0.95 }}
        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          following
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {following ? (
          <>
            <Check className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Follow
          </>
        )}
      </motion.button>
    </motion.div>
  );
};
