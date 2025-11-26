import { useEffect } from "react";
import { useSystemStore } from "@/stores/systemStore";
import { supabase } from "@/integrations/supabase/client";

export function useRateLimitObserver() {
  const {
    rateLimited,
    cooldownUntil,
    setRateLimited,
  } = useSystemStore();
  
  // Check and update rate limit status
  useEffect(() => {
    if (!cooldownUntil) return;
    
    const checkCooldown = () => {
      const now = Date.now();
      if (now >= cooldownUntil) {
        setRateLimited(null);
      }
    };
    
    // Check immediately
    checkCooldown();
    
    // Check every second
    const interval = setInterval(checkCooldown, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownUntil, setRateLimited]);
  
  const recordRateLimit = async (cooldownMs: number = 60000) => {
    const cooldownTime = Date.now() + cooldownMs;
    setRateLimited(cooldownTime);
    
    // Emit system event
    await supabase.from('system_events').insert({
      type: 'RATE_LIMIT_WARNING',
      severity: 'warn',
      data: {
        cooldown_until: cooldownTime,
        cooldown_ms: cooldownMs,
      },
    });
  };
  
  const nextAllowedTime = cooldownUntil && cooldownUntil > Date.now()
    ? cooldownUntil
    : null;
  
  const cooldown = nextAllowedTime
    ? Math.ceil((nextAllowedTime - Date.now()) / 1000)
    : 0;
  
  return {
    rateLimited,
    cooldown,
    nextAllowedTime,
    recordRateLimit,
  };
}
