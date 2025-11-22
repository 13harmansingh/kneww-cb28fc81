import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isBanned, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (isBanned) {
      navigate("/banned");
      return;
    }

    if (requireAdmin && !isAdmin) {
      navigate("/");
      return;
    }
  }, [user, isAdmin, isBanned, authLoading, roleLoading, navigate, requireAdmin]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || isBanned || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};
