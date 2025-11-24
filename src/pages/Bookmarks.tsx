import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NewsCard } from "@/components/NewsCard";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { NewsCardSkeleton } from "@/components/skeletons/NewsCardSkeleton";

interface Bookmark {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  article_image: string;
  bias?: string | null;
  summary?: string | null;
  ownership?: string | null;
  sentiment?: string | null;
  claims?: any;
}

export default function Bookmarks() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Guard: ensure router context exists
  if (!location) return null;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-4">
        <div className="max-w-7xl mx-auto pt-8">
          <h1 className="text-3xl font-bold text-white mb-6">My Bookmarks</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4 border-b border-border/50">
        <h1 className="text-3xl font-bold text-white">My Bookmarks</h1>
      </div>
      
      {/* Scrollable Content */}
      <div className="px-4 pt-6">
        <div className="max-w-7xl mx-auto">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No bookmarks yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Start saving articles by tapping the bookmark icon
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <NewsCard
                  key={bookmark.id}
                  id={bookmark.article_id}
                  title={bookmark.article_title}
                  image={bookmark.article_image}
                  url={bookmark.article_url}
                  bias={bookmark.bias || undefined}
                  summary={bookmark.summary || undefined}
                  ownership={bookmark.ownership || undefined}
                  sentiment={bookmark.sentiment || undefined}
                  claims={bookmark.claims ? (Array.isArray(bookmark.claims) ? bookmark.claims : []) : undefined}
                  onRefresh={fetchBookmarks}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
