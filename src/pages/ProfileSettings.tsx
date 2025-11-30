import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Camera, User, Mail, LogOut, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SwipeIndicator } from "@/components/SwipeIndicator";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useAppState } from "@/stores/appState";
import { DiscoverSection } from "@/components/profile/DiscoverSection";
import { FollowingPanel } from "@/components/follow/FollowingPanel";
import { DailyNewspaper } from "@/components/DailyNewspaper";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  principal_language: string | null;
}

export default function ProfileSettings() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { preferences, loading: prefsLoading, saving, updatePreference } = usePreferences();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();
  const { setUserPrincipalLanguage, setSelectedLanguage } = useAppState();

  // Guard: ensure router context exists
  if (!location) return null;

  // Scroll position restoration
  useScrollRestoration({ pageKey: 'profile-settings-page', enabled: true });

  // Swipe navigation
  const { swipeProgress, swipeDirection } = useSwipeNavigation({
    enabled: true,
  });

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "nl", name: "Nederlands" },
    { code: "pl", name: "Polski" },
    { code: "ru", name: "Русский" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
    { code: "tr", name: "Türkçe" },
    { code: "sv", name: "Svenska" },
    { code: "no", name: "Norsk" },
    { code: "da", name: "Dansk" },
    { code: "fi", name: "Suomi" },
    { code: "el", name: "Ελληνικά" },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        // Profile doesn't exist yet, create it
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user?.id,
            display_name: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
        setDisplayName(newProfile?.display_name || "");
      } else {
        setProfile(data);
        setDisplayName(data?.display_name || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);
      setEditing(false);
      toast.success("Profile refined successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (authLoading || loading || prefsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b border-border/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground">Profile & Settings</h1>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="w-4 h-4 animate-pulse" />
              Preserving preferences...
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Profile
            </h2>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-accent" />
                  )}
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition"
                  onClick={() => toast.info("Photo upload coming soon!")}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                <p className="text-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Display Name
              </label>
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-secondary border border-border rounded-lg py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex-1 bg-accent text-white rounded-lg py-2 px-4 font-semibold hover:bg-accent/80 transition disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setDisplayName(profile.display_name || "");
                      }}
                      disabled={savingProfile}
                      className="flex-1 bg-secondary text-foreground rounded-lg py-2 px-4 font-semibold hover:bg-secondary/80 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 border border-border">
                  <p className="text-foreground">
                    {profile.display_name || "Not set"}
                  </p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-accent text-sm font-semibold hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-accent" />
              Settings
            </h2>

            {/* Language Preference */}
            <div className="space-y-3">
              <Label htmlFor="language" className="text-muted-foreground">
                Default news language
              </Label>
              <select
                id="language"
                value={preferences.default_language}
                onChange={(e) => {
                  const newLanguage = e.target.value;
                  updatePreference("default_language", newLanguage);
                  setUserPrincipalLanguage(newLanguage);
                  setSelectedLanguage(newLanguage);
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Feature Toggles */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-translate" className="text-foreground font-medium">
                    Auto-translate
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically translate articles to your preferred language
                  </p>
                </div>
                <Switch
                  id="auto-translate"
                  checked={preferences.auto_translate}
                  onCheckedChange={(checked) => updatePreference("auto_translate", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-ai" className="text-foreground font-medium">
                    Show AI Analysis
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display AI-powered analysis for articles
                  </p>
                </div>
                <Switch
                  id="show-ai"
                  checked={preferences.show_ai_analysis}
                  onCheckedChange={(checked) => updatePreference("show_ai_analysis", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-foreground font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme throughout the app
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={preferences.dark_mode}
                  onCheckedChange={(checked) => updatePreference("dark_mode", checked)}
                />
              </div>
            </div>
          </div>

          {/* Daily Newspaper */}
          <DailyNewspaper />

          {/* Discover Section */}
          <DiscoverSection />

          {/* Following Panel */}
          <FollowingPanel />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-3 px-4 font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Swipe Navigation Indicator */}
      <SwipeIndicator progress={swipeProgress} direction={swipeDirection} />

      <BottomNav />
    </div>
  );
}
