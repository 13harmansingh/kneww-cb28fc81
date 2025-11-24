import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
  banned: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Guard: ensure router context exists
  if (!location) return null;

  useEffect(() => {
    if (!authLoading && !roleLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, banned, created_at");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get user emails from auth (requires service role in production)
      const userIds = profilesData?.map((p) => p.id) || [];
      const usersWithDetails: UserWithRole[] = [];

      for (const profile of profilesData || []) {
        const roleData = rolesData?.find((r) => r.user_id === profile.id);
        const { data: authData } = await supabase.auth.admin.getUserById(profile.id);

        usersWithDetails.push({
          id: profile.id,
          email: authData?.user?.email || "Unknown",
          display_name: profile.display_name,
          role: (roleData?.role as AppRole) || "user",
          banned: profile.banned || false,
          created_at: profile.created_at,
        });
      }

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: AppRole) => {
    try {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Send notification
      await supabase.rpc("send_notification", {
        _user_id: userId,
        _title: "Role Changed",
        _description: `Your role has been updated to ${newRole}`,
        _type: "role_change",
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast.success("User role updated");
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to update role");
    }
  };

  const toggleBan = async (userId: string, currentBannedState: boolean) => {
    try {
      const newBannedState = !currentBannedState;

      const { error } = await supabase
        .from("profiles")
        .update({ banned: newBannedState })
        .eq("id", userId);

      if (error) throw error;

      // Send notification
      if (newBannedState) {
        await supabase.rpc("send_notification", {
          _user_id: userId,
          _title: "Account Suspended",
          _description: "Your account has been suspended. Please contact support.",
          _type: "banned",
        });
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, banned: newBannedState } : u))
      );

      toast.success(newBannedState ? "User banned" : "User unbanned");
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast.error("Failed to update ban status");
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">User</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {user.display_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Select
                        value={user.role}
                        onValueChange={(value) => changeUserRole(user.id, value as AppRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      {user.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="w-3 h-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Button
                        variant={user.banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleBan(user.id, user.banned)}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
