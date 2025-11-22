import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "user" | "editor";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // Check if user is banned
        const { data: profileData } = await supabase
          .from("profiles")
          .select("banned")
          .eq("id", user.id)
          .single();

        if (profileData?.banned) {
          setIsBanned(true);
          setLoading(false);
          return;
        }

        // Fetch user role
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
          setRole("user"); // Default to user role
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          // No role record found, default to user
          setRole("user");
        }
      } catch (error) {
        console.error("Error in fetchRole:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isEditor = role === "editor";

  return { role, loading, isAdmin, isEditor, isBanned };
};
