import { Home, Compass, Bookmark, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/stores/appState";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastTapRef = useRef<number>(0);
  const { 
    setSelectedRegion, 
    setSelectedCountry, 
    setSelectedState 
  } = useAppState();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Bookmark, label: "Saved", path: "/bookmarks" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  // Double-tap handler for home button - resets all state
  const handleHomeClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Double-tap detected (within 300ms)
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      e.preventDefault();
      // Reset all navigation state
      setSelectedRegion(null);
      setSelectedCountry(null);
      setSelectedState(null);
      navigate("/", { replace: true });
    }
    
    lastTapRef.current = now;
  }, [navigate, setSelectedRegion, setSelectedCountry, setSelectedState]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === "/profile" && location.pathname === "/settings");
          const isHome = path === "/";
          
          return isHome ? (
            <Link
              key={path}
              to={path}
              onClick={handleHomeClick}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-accent scale-105" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </Link>
          ) : (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-accent scale-105" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
