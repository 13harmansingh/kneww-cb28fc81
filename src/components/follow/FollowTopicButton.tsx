import { Button } from '@/components/ui/button';
import { Heart, Check } from 'lucide-react';
import { useFollowManager } from '@/hooks/useFollowManager';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FollowTopicButtonProps {
  topic: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const FollowTopicButton = ({ 
  topic, 
  variant = 'outline', 
  size = 'sm',
  className,
  showIcon = true
}: FollowTopicButtonProps) => {
  const { isFollowing, toggleFollow, syncing } = useFollowManager();
  const following = isFollowing('topic', topic);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFollow('topic', topic);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant={following ? 'default' : variant}
        size={size}
        onClick={handleClick}
        disabled={syncing}
        className={cn(
          "gap-2 transition-all duration-300",
          following && "bg-primary text-primary-foreground",
          className
        )}
      >
        {showIcon && (
          <motion.div
            initial={false}
            animate={{ 
              scale: following ? [1, 1.2, 1] : 1,
              rotate: following ? [0, -10, 10, 0] : 0
            }}
            transition={{ duration: 0.5 }}
          >
            {following ? (
              <Check className="w-4 h-4" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
          </motion.div>
        )}
        {following ? 'Following' : 'Follow'}
      </Button>
    </motion.div>
  );
};
