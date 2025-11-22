import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, loading, saving, updatePreference } = usePreferences();
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
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="w-4 h-4 animate-pulse" />
              Saving...
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Language Preference */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Language</h2>
            <div className="space-y-3">
              <Label htmlFor="language" className="text-muted-foreground">
                Default news language
              </Label>
              <select
                id="language"
                value={preferences.default_language}
                onChange={(e) => updatePreference("default_language", e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Features</h2>
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
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
