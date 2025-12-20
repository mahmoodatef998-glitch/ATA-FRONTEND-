"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Edit, Trash2, Loader2, CheckCircle, XCircle, Clock, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UserRole, UserAccountStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  accountStatus?: UserAccountStatus;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800",
  ACCOUNTANT: "bg-blue-100 text-blue-800",
  OPERATIONS_MANAGER: "bg-green-100 text-green-800",
  FACTORY_SUPERVISOR: "bg-yellow-100 text-yellow-800",
  SALES_REP: "bg-purple-100 text-purple-800",
  CLIENT: "bg-gray-100 text-gray-800",
  TECHNICIAN: "bg-cyan-100 text-cyan-800",
  SUPERVISOR: "bg-orange-100 text-orange-800",
  HR: "bg-pink-100 text-pink-800",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  OPERATIONS_MANAGER: "Operations Manager",
  FACTORY_SUPERVISOR: "Factory Supervisor",
  SALES_REP: "Sales Rep",
  CLIENT: "Client",
  TECHNICIAN: "Technician",
  SUPERVISOR: "Supervisor",
  HR: "HR",
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ACCOUNTANT" as UserRole,
  });

  // Fetch users (Admin only)
  const showToast = useCallback(
    (options: Parameters<typeof toast>[0]) => toast(options),
    []
  );

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch all users
      const allResponse = await fetch("/api/users");
      const allData = await allResponse.json();
      
      // Fetch pending users
      const pendingResponse = await fetch("/api/users?status=PENDING");
      const pendingData = await pendingResponse.json();
      
      if (allData.success && allData.data) {
        // API returns { users: [...], pagination: {...} }
        const usersArray = Array.isArray(allData.data) ? allData.data : (allData.data.users || []);
        setUsers(usersArray);
      }
      
      if (pendingData.success && pendingData.data) {
        // API returns { users: [...], pagination: {...} }
        const pendingArray = Array.isArray(pendingData.data) ? pendingData.data : (pendingData.data.users || []);
        setPendingUsers(pendingArray);
      }
      
      if (!allData.success || !pendingData.success) {
          showToast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
        showToast({
        title: "Error",
        description: "An error occurred while loading users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useStableAsyncEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: editingUser ? "User updated successfully" : "User created successfully",
        });
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "ACCOUNTANT",
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving user",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  // Handle approve/reject
  const handleApproveReject = async (userId: number, action: "approve" | "reject", reason?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          rejectionReason: reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || `User ${action === "approve" ? "approved" : "rejected"} successfully`,
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} user`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: `An error occurred while ${action === "approve" ? "approving" : "rejecting"} user`,
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting user",
        variant: "destructive",
      });
    }
  };

  // Reset form
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "ACCOUNTANT",
    });
  };

  // Wait for session to load
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only administrators can access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Users Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage internal users and permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) {
            // Opening dialog - reset form
            setEditingUser(null);
            setFormData({
              name: "",
              email: "",
              password: "",
              role: "ACCOUNTANT",
            });
            setIsDialogOpen(true);
          } else {
            // Closing dialog
            handleDialogClose();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user information"
                  : "Enter new user information"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password {editingUser && "(leave empty to keep current)"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved
          </TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </CardTitle>
              <CardDescription>
                List of all internal users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.accountStatus && (
                            <div className="text-xs mt-1">
                              <Badge
                                variant="outline"
                                className={
                                  user.accountStatus === "APPROVED"
                                    ? "bg-green-50 text-green-800 border-green-200"
                                    : user.accountStatus === "PENDING"
                                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                    : "bg-red-50 text-red-800 border-red-200"
                                }
                              >
                                {user.accountStatus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                        {user.accountStatus === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveReject(user.id, "approve")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject User Registration</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Please provide a reason for rejecting this registration.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4">
                                  <Label htmlFor={`rejectionReason-${user.id}`}>Rejection Reason</Label>
                                  <Input
                                    id={`rejectionReason-${user.id}`}
                                    placeholder="Enter rejection reason..."
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      const reason = (document.getElementById(`rejectionReason-${user.id}`) as HTMLInputElement)?.value;
                                      handleApproveReject(user.id, "reject", reason);
                                    }}
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                        {user.accountStatus !== "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Users ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                Users waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending users
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveReject(user.id, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject User Registration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Please provide a reason for rejecting this registration.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-4">
                                <Label htmlFor={`pending-rejection-${user.id}`}>Rejection Reason</Label>
                                <Input
                                  id={`pending-rejection-${user.id}`}
                                  placeholder="Enter rejection reason..."
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const reason = (document.getElementById(`pending-rejection-${user.id}`) as HTMLInputElement)?.value;
                                    handleApproveReject(user.id, "reject", reason);
                                  }}
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approved Users ({users.filter(u => u.accountStatus === "APPROVED").length})
              </CardTitle>
              <CardDescription>
                Approved users who can access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.filter(u => u.accountStatus === "APPROVED").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved users
                </div>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.accountStatus === "APPROVED").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          Approved
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

