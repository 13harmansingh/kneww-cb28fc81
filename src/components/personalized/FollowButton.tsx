import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useEffect, useState } from 'react';

interface FollowButtonProps {
  type: 'state' | 'topic';
  value: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const FollowButton = ({ type, value, variant = 'outline', size = 'sm' }: FollowButtonProps) => {
  const { follows, addFollow, removeFollow } = usePersonalizedFeed();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const following = follows.some(f => f.follow_type === type && f.value === value);
    setIsFollowing(following);
  }, [follows, type, value]);

  const handleToggle = () => {
    if (isFollowing) {
      const follow = follows.find(f => f.follow_type === type && f.value === value);
      if (follow) {
        removeFollow(follow.id);
      }
    } else {
      addFollow(type, value);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'default' : variant}
      size={size}
      onClick={handleToggle}
      className="gap-2"
    >
      <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};
