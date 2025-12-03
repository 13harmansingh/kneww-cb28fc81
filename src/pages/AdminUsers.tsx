import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Ban, CheckCircle, UserPlus, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminUsers, getAccessRequests, createUser, rejectAccessRequest } from "@/api/admin";

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
  banned: boolean;
  created_at: string;
}

interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const navigate = useNavigate();

  // Create user dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("user");
  const [creatingUser, setCreatingUser] = useState(false);

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
      fetchAccessRequests();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await getAdminUsers();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await getAccessRequests();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setAccessRequests(response.data?.requests || []);
    } catch (error) {
      console.error("Error fetching access requests:", error);
      toast.error("Failed to load access requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.error("All fields are required");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await createUser({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName,
        role: newUserRole,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("User created successfully");
      setShowCreateDialog(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("user");
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || !newUserPassword) {
      toast.error("Password is required");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await createUser({
        email: selectedRequest.email,
        password: newUserPassword,
        full_name: selectedRequest.full_name,
        role: newUserRole,
        request_id: selectedRequest.id,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Access granted successfully");
      setShowApproveDialog(false);
      setSelectedRequest(null);
      setNewUserPassword("");
      setNewUserRole("user");
      fetchUsers();
      fetchAccessRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(error.message || "Failed to grant access");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await rejectAccessRequest(requestId);

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Request rejected");
      fetchAccessRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.message || "Failed to reject request");
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
          _title: "Access Revoked",
          _description: "Your account access has been suspended. Please contact support.",
          _type: "banned",
        });
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, banned: newBannedState } : u))
      );

      toast.success(newBannedState ? "Access revoked" : "Access restored");
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast.error("Failed to update access status");
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

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Intelligence Management</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="requests">
              Intelligence Seekers {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Grant Access
              </Button>
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
                              Revoked
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
                            {user.banned ? "Restore" : "Revoke"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <p className="text-muted-foreground">No pending access requests</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Name</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Email</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Reason</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-secondary/20 transition">
                          <td className="p-4">
                            <p className="font-medium text-foreground">{request.full_name}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground max-w-xs truncate">
                              {request.reason || "—"}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApproveDialog(true);
                                }}
                                className="gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Grant
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                                className="gap-1"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Intelligence Access</DialogTitle>
            <DialogDescription>
              Create a new user account and grant access to knew.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                "Grant Access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Access to {selectedRequest?.full_name}</DialogTitle>
            <DialogDescription>
              Set a password for this user to complete access approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={selectedRequest?.email || ""} disabled />
            </div>
            <div>
              <Label htmlFor="approve-password">Password</Label>
              <Input
                id="approve-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="approve-role">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveRequest} disabled={creatingUser}>
              {creatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                "Grant Access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
