import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Camera, User, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  principal_language: string | null;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [principalLanguage, setPrincipalLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

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
        setPrincipalLanguage(data?.principal_language || "en");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          principal_language: principalLanguage,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, display_name: displayName, principal_language: principalLanguage } : null);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
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

  if (authLoading || loading) {
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
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          {/* Avatar Section */}
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

          {/* Email Section */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <p className="text-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Display Name Section */}
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
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-accent text-white rounded-lg py-2 px-4 font-semibold hover:bg-accent/80 transition disabled:opacity-50"
                  >
                    {saving ? (
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
                    disabled={saving}
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

          {/* Principal Language Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>🌐</span>
              Principal Language
            </label>
            <p className="text-xs text-muted-foreground">
              Your preferred language for news. Articles will be shown in this language when available.
            </p>
            <div className="flex gap-2">
              <select
                value={principalLanguage}
                onChange={async (e) => {
                  const newLanguage = e.target.value;
                  setPrincipalLanguage(newLanguage);
                  
                  // Save immediately
                  try {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ principal_language: newLanguage })
                      .eq("id", user?.id);
                    
                    if (error) throw error;
                    
                    setProfile((prev) => prev ? { ...prev, principal_language: newLanguage } : null);
                    toast.success("Language preference updated");
                  } catch (error) {
                    console.error("Error updating language:", error);
                    toast.error("Failed to update language");
                  }
                }}
                className="flex-1 px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg py-3 px-4 font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
