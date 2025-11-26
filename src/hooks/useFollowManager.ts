import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Follow {
  id: string;
  follow_type: 'state' | 'topic';
  value: string;
  created_at: string;
}

const RATE_LIMIT_MS = 500; // Prevent spam clicking

// Telemetry logging helper
const logTelemetry = async (eventType: string, metadata: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('telemetry_logs').insert({
      event_type: eventType,
      user_id: user?.id,
      endpoint: 'follow-manager',
      metadata,
    });
  } catch (error) {
    console.error('Telemetry logging failed:', error);
  }
};

export const useFollowManager = () => {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const lastActionTimeRef = useRef<number>(0);
  const followCacheRef = useRef<Map<string, boolean>>(new Map());

  // Generate cache key
  const getCacheKey = (type: 'state' | 'topic', value: string) => `${type}:${value}`;

  // Fetch all follows
  const fetchFollows = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFollows([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const followsData = (data || []) as Follow[];
      setFollows(followsData);

      // Update cache
      followCacheRef.current.clear();
      followsData.forEach(f => {
        followCacheRef.current.set(getCacheKey(f.follow_type, f.value), true);
      });

      // Log telemetry
      await logTelemetry('follows_loaded', { count: followsData.length });
    } catch (error) {
      console.error('Error fetching follows:', error);
      await logTelemetry('follow_sync_error', { error: String(error), action: 'fetch' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  // Check if following
  const isFollowing = useCallback((type: 'state' | 'topic', value: string): boolean => {
    return followCacheRef.current.get(getCacheKey(type, value)) || false;
  }, []);

  // Follow
  const follow = useCallback(async (type: 'state' | 'topic', value: string) => {
    // Rate limiting
    const now = Date.now();
    if (now - lastActionTimeRef.current < RATE_LIMIT_MS) {
      toast.info('Please wait a moment');
      return false;
    }
    lastActionTimeRef.current = now;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to follow');
      return false;
    }

    // Optimistic update
    const cacheKey = getCacheKey(type, value);
    const wasFollowing = followCacheRef.current.get(cacheKey);
    
    if (wasFollowing) {
      toast.info(`Already following ${value}`);
      return false;
    }

    // Update cache optimistically
    followCacheRef.current.set(cacheKey, true);
    const tempId = `temp-${Date.now()}`;
    const tempFollow: Follow = {
      id: tempId,
      follow_type: type,
      value,
      created_at: new Date().toISOString(),
    };
    setFollows(prev => [tempFollow, ...prev]);

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({ user_id: user.id, follow_type: type, value })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (already following)
        if (error.code === '23505') {
          toast.info(`Already following ${value}`);
          // Refresh to sync state
          fetchFollows();
          return false;
        }
        throw error;
      }

      // Replace temp with real data
      setFollows(prev => prev.map(f => f.id === tempId ? data as Follow : f));
      
      toast.success(`Now following ${value}`);
      
      // Log telemetry
      await logTelemetry(type === 'state' ? 'follow_state' : 'follow_topic', { type, value });

      // Emit event for global sync
      window.dispatchEvent(new CustomEvent('follow-updated'));
      
      return true;
    } catch (error) {
      // Rollback optimistic update
      followCacheRef.current.delete(cacheKey);
      setFollows(prev => prev.filter(f => f.id !== tempId));
      
      console.error('Error following:', error);
      toast.error('Failed to follow');
      
      await logTelemetry('follow_sync_error', { error: String(error), action: 'follow', type, value });
      
      return false;
    } finally {
      setSyncing(false);
    }
  }, [fetchFollows]);

  // Unfollow
  const unfollow = useCallback(async (type: 'state' | 'topic', value: string) => {
    // Rate limiting
    const now = Date.now();
    if (now - lastActionTimeRef.current < RATE_LIMIT_MS) {
      toast.info('Please wait a moment');
      return false;
    }
    lastActionTimeRef.current = now;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in');
      return false;
    }

    // Find the follow to remove
    const followToRemove = follows.find(f => f.follow_type === type && f.value === value);
    if (!followToRemove) {
      toast.info(`Not following ${value}`);
      return false;
    }

    // Optimistic update
    const cacheKey = getCacheKey(type, value);
    followCacheRef.current.delete(cacheKey);
    setFollows(prev => prev.filter(f => f.id !== followToRemove.id));

    setSyncing(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', followToRemove.id);

      if (error) throw error;

      toast.success(`Unfollowed ${value}`);
      
      // Log telemetry
      await logTelemetry(type === 'state' ? 'unfollow_state' : 'unfollow_topic', { type, value });

      // Emit event for global sync
      window.dispatchEvent(new CustomEvent('follow-updated'));
      
      return true;
    } catch (error) {
      // Rollback optimistic update
      followCacheRef.current.set(cacheKey, true);
      setFollows(prev => [followToRemove, ...prev]);
      
      console.error('Error unfollowing:', error);
      toast.error('Failed to unfollow');
      
      await logTelemetry('follow_sync_error', { error: String(error), action: 'unfollow', type, value });
      
      return false;
    } finally {
      setSyncing(false);
    }
  }, [follows]);

  // Toggle follow
  const toggleFollow = useCallback(async (type: 'state' | 'topic', value: string) => {
    if (isFollowing(type, value)) {
      return await unfollow(type, value);
    } else {
      return await follow(type, value);
    }
  }, [isFollowing, follow, unfollow]);

  // Unfollow by ID
  const unfollowById = useCallback(async (followId: string) => {
    const followToRemove = follows.find(f => f.id === followId);
    if (!followToRemove) return false;
    
    return await unfollow(followToRemove.follow_type, followToRemove.value);
  }, [follows, unfollow]);

  return {
    follows,
    loading,
    syncing,
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
    unfollowById,
    refresh: fetchFollows,
  };
};
