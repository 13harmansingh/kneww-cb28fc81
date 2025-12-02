import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseOnboardingOptions {
  userId: string | undefined;
}

export function useOnboarding({ userId }: UseOnboardingOptions) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error checking onboarding status:", error);
          // If profile doesn't exist, show onboarding
          setShowOnboarding(true);
        } else if (data && !data.onboarding_completed) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } catch (err) {
        console.error("Onboarding check error:", err);
        setShowOnboarding(true); // Default to showing onboarding on error
      } finally {
        setLoading(false);
        setChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [userId]);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (error) {
        console.error("Error completing onboarding:", error);
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
    } finally {
      setShowOnboarding(false);
    }
  }, [userId]);

  // Skip onboarding (same as complete)
  const skipOnboarding = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  // Replay onboarding tour (for settings page)
  const replayOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    loading,
    checked,
    completeOnboarding,
    skipOnboarding,
    replayOnboarding,
  };
}
