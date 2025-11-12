import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NewsCard } from "@/components/NewsCard";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface Bookmark {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  article_image: string;
}

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 px-4">
      <div className="max-w-7xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Bookmarks</h1>
        
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
                onRefresh={fetchBookmarks}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
