/**
 * User Role Assignment Page
 * Admin UI for assigning roles to users
 */

"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { ArrowLeft, User, Shield, X } from "lucide-react";
import { useApiErrorHandler } from "@/lib/api-error-handler";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Role {
  id: number;
  name: string;
  displayName: string;
  isSystem: boolean;
}

interface UserRole {
  id: number;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  assignedBy: number | null;
  assignerName: string | null;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UserRoleAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const handleError = useApiErrorHandler();
  const canManage = useCan(PermissionAction.ROLE_MANAGE);
  const userId = parseInt(params.userId as string);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, rolesResponse, userRolesResponse] = await Promise.all([
        fetch(`/api/team/members/${userId}`),
        fetch("/api/rbac/roles"),
        fetch(`/api/rbac/users/${userId}/roles`),
      ]);

      const [userResult, rolesResult, userRolesResult] = await Promise.all([
        userResponse.json(),
        rolesResponse.json(),
        userRolesResponse.json(),
      ]);

      if (userResult.success) {
        setUser({
          id: userResult.data.id,
          name: userResult.data.name,
          email: userResult.data.email,
          role: userResult.data.role,
        });
      } else {
        handleError(userResult);
      }

      if (rolesResult.success) {
        setAvailableRoles(rolesResult.data);
      } else {
        handleError(rolesResult);
      }

      if (userRolesResult.success) {
        setUserRoles(userRolesResult.data);
      } else {
        handleError(userRolesResult);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError, userId]);

  useStableAsyncEffect(() => {
    if (canManage && !isNaN(userId)) {
      fetchData();
    }
  }, [canManage, fetchData, userId]);

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/rbac/users/${userId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: parseInt(selectedRoleId),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Role assigned successfully",
        });
        setSelectedRoleId("");
        fetchData();
      } else {
        handleError(result);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleRemoveRole = async (userRoleId: number, roleId: number) => {
    try {
      const response = await fetch(`/api/rbac/users/${userId}/roles?roleId=${roleId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Role removed successfully",
        });
        setOpenDeleteDialog(null);
        fetchData();
      } else {
        handleError(result);
      }
    } catch (error) {
      handleError(error);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
                You don&apos;t have permission to manage user roles.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const assignedRoleIds = userRoles.map(ur => ur.roleId);
  const availableRolesToAssign = availableRoles.filter(
    r => !assignedRoleIds.includes(r.id)
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            Role Assignment
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage roles for {user.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Default Role:</strong> <Badge>{user.role}</Badge></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
          <CardDescription>
            Additional roles assigned to this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <p className="text-muted-foreground">No additional roles assigned</p>
          ) : (
            <div className="space-y-2">
              {userRoles.map(userRole => (
                <div
                  key={userRole.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <div>
                      <p className="font-semibold">{userRole.roleDisplayName}</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned by {userRole.assignerName || "System"} on{" "}
                        {new Date(userRole.assignedAt).toLocaleDateString()}
                        {userRole.expiresAt && (
                          <> • Expires: {new Date(userRole.expiresAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenDeleteDialog(userRole.roleId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Role</CardTitle>
          <CardDescription>
            Assign an additional role to this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRolesToAssign.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.displayName}
                    {role.isSystem && " (System)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedRoleId || availableRolesToAssign.length === 0}
            >
              Assign Role
            </Button>
          </div>
          {availableRolesToAssign.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              All available roles are already assigned to this user
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog
        open={openDeleteDialog !== null}
        onOpenChange={() => setOpenDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this role from the user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (openDeleteDialog) {
                  const userRole = userRoles.find(ur => ur.roleId === openDeleteDialog);
                  if (userRole) {
                    handleRemoveRole(userRole.id, openDeleteDialog);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

