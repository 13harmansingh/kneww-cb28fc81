import { useEffect } from "react";
import { Ban, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Banned() {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Guard: ensure router context exists
  if (!location) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <Ban className="h-16 w-16 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. If you believe this is a mistake, please contact
            support.
          </p>
        </div>

        <Button onClick={handleSignOut} variant="outline" className="w-full gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
