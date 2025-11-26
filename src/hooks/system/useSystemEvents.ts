import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSystemStore } from "@/stores/systemStore";

interface SystemEvent {
  id: string;
  type: string;
  data: any;
  severity: 'info' | 'warn' | 'error' | 'critical';
  user_id?: string;
  created_at: string;
}

export function useSystemEvents() {
  useEffect(() => {
    const channel = supabase
      .channel('system-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
        },
        (payload) => {
          const event = payload.new as SystemEvent;
          handleSystemEvent(event);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

function handleSystemEvent(event: SystemEvent) {
  console.log('[SystemEvent]', event.type, event);
  
  switch (event.type) {
    case 'NEWS_REFRESHED':
      toast.success('News refreshed', {
        description: 'Latest articles are now available',
      });
      break;
      
    case 'AI_ANALYSIS_COMPLETED':
      // Silent update - handled by component state
      break;
      
    case 'USER_LOGGED_IN':
      // Silent - handled by auth system
      break;
      
    case 'GLOBAL_SETTING_CHANGED':
      toast.info('Settings updated', {
        description: 'Global configuration has been updated',
      });
      break;
      
    case 'RATE_LIMIT_WARNING':
      toast.warning('API rate limit reached', {
        description: 'Please wait a moment before making more requests',
      });
      useSystemStore.getState().setRateLimited(
        event.data.cooldown_until || Date.now() + 60000
      );
      break;
      
    case 'ERROR_BOUNDARY_TRIGGERED':
      if (event.severity === 'critical') {
        toast.error('Critical error detected', {
          description: 'The system is attempting to recover',
        });
      }
      break;
      
    case 'BACKGROUND_JOB_FAILED':
      toast.error('Background task failed', {
        description: `Task: ${event.data.task_type}`,
      });
      break;
      
    case 'RECOVERY_TASK_SUCCEEDED':
      toast.success('System recovered', {
        description: 'Failed operation completed successfully',
      });
      break;
  }
}
