import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useDebounce } from "./useDebounce";
import { toast } from "sonner";

interface UserPreferences {
  default_language: string;
  preferred_categories: string[];
  dark_mode: boolean;
  auto_translate: boolean;
  show_ai_analysis: boolean;
}

const defaultPreferences: UserPreferences = {
  default_language: "en",
  preferred_categories: [],
  dark_mode: true,
  auto_translate: false,
  show_ai_analysis: true,
};

export const usePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const debouncedPreferences = useDebounce(preferences, 500);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = not found
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          setPreferences({
            default_language: data.default_language || "en",
            preferred_categories: data.preferred_categories || [],
            dark_mode: data.dark_mode ?? true,
            auto_translate: data.auto_translate ?? false,
            show_ai_analysis: data.show_ai_analysis ?? true,
          });
        } else {
          // Create default preferences
          const { error: insertError } = await supabase
            .from("user_preferences")
            .insert({
              user_id: user.id,
              ...defaultPreferences,
            });

          if (insertError) {
            console.error("Error creating preferences:", insertError);
          }
        }
      } catch (error) {
        console.error("Error in fetchPreferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;

    const savePreferences = async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("user_preferences")
          .update(debouncedPreferences)
          .eq("user_id", user.id);

        if (error) throw error;

        // Log to telemetry
        await supabase.from("telemetry_logs").insert([{
          event_type: "preference.update",
          user_id: user.id,
          endpoint: "/preferences",
          metadata: debouncedPreferences as any,
        }]);
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save preferences");
      } finally {
        setSaving(false);
      }
    };

    savePreferences();
  }, [debouncedPreferences, user, loading]);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return { preferences, loading, saving, updatePreference };
};
