"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Clock, Loader2, User, MapPin, Edit, Trash2, Eye, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionGuard, RoleAssignmentGuard } from "@/lib/permissions/components";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive?: boolean;
  createdAt: string;
  department?: string | null;
  specialization?: string | null;
  stats: {
    workingDays: number;
    totalHours: number;
    overtimeHours: number;
    isCheckedIn: boolean;
    checkInTime: string | null;
  };
}

export default function TeamMembersPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "TECHNICIAN" as UserRole,
    department: "",
    specialization: "",
    password: "",
  });
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "TECHNICIAN" as UserRole,
    isActive: true,
    department: "",
    specialization: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/team/members");
      const result = await response.json();

      if (result.success) {
        setMembers(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load team members",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useStableAsyncEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleEdit = (member: TeamMember, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingMember(member);
    setEditFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department || "",
      specialization: member.specialization || "",
      password: "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      setSaving(true);
      
      // CRITICAL: Validate that we're not editing the current user's own account
      if (session?.user?.id === editingMember.id) {
        toast({
          title: "Error",
          description: "Cannot edit your own account through this interface. Please use profile settings.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // CRITICAL: Prepare update data - only send fields that have changed
      // Never send role if it hasn't changed or if it's undefined
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
      };
      
      // CRITICAL: Only include role if it's explicitly different from current role
      // AND it's a valid role (not empty, not undefined, not null)
      if (
        editFormData.role && 
        String(editFormData.role).trim() !== "" &&
        String(editFormData.role) !== String(editingMember.role)
      ) {
        // Double-check role is valid before sending
        const validRoles = ["TECHNICIAN", "SUPERVISOR", "HR", "OPERATIONS_MANAGER", "ACCOUNTANT", "ADMIN"];
        if (validRoles.includes(String(editFormData.role))) {
          updateData.role = editFormData.role;
        } else {
          console.error("[Team Members] Invalid role in editFormData:", editFormData.role);
          toast({
            title: "Error",
            description: "Invalid role selected. Please select a valid role.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      
      // CRITICAL: Log what we're sending for debugging
      console.log("[Team Members] Update request:", {
        memberId: editingMember.id,
        memberCurrentRole: editingMember.role,
        updateData: updateData,
        currentUserRole: session?.user?.role,
        currentUserId: session?.user?.id,
      });
      
      // Only include fields that have values
      if (editFormData.department !== undefined && editFormData.department !== null) {
        updateData.department = editFormData.department;
      }
      if (editFormData.specialization !== undefined && editFormData.specialization !== null) {
        updateData.specialization = editFormData.specialization;
      }
      // Only send password if it's been changed (not empty)
      if (editFormData.password && editFormData.password.trim() !== "") {
        updateData.password = editFormData.password;
      }
      
      // CRITICAL: Log what we're sending for debugging
      console.log("[Team Members] Update request:", {
        memberId: editingMember.id,
        memberCurrentRole: editingMember.role,
        updateData: updateData,
      });
      
      const response = await fetch(`/api/team/members/${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Team member updated successfully",
        });
        setEditDialogOpen(false);
        setEditingMember(null);
        fetchMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update team member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating team member",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (member: TeamMember, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteMember(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/team/members/${deleteMember.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Team member deleted successfully",
        });
        setDeleteDialogOpen(false);
        setDeleteMember(null);
        fetchMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete team member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting team member",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async () => {
    // Validation
    if (!addFormData.name || addFormData.name.length < 2) {
      toast({
        title: "Error",
        description: "Name must be at least 2 characters",
        variant: "destructive",
      });
      return;
    }

    if (!addFormData.email || !addFormData.email.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!addFormData.password || addFormData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);
      const response = await fetch("/api/team/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addFormData.name,
          email: addFormData.email,
          password: addFormData.password,
          phone: addFormData.phone || undefined,
          role: addFormData.role,
          isActive: addFormData.isActive,
          department: addFormData.department || undefined,
          specialization: addFormData.specialization || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Team member added successfully",
        });
        setAddDialogOpen(false);
        setAddFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          role: "TECHNICIAN",
          isActive: true,
          department: "",
          specialization: "",
        });
        fetchMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add team member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding team member",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Permission checks using RBAC
  const canCreate = usePermission(PermissionAction.USER_CREATE);
  const canUpdate = usePermission(PermissionAction.USER_UPDATE);
  const canDelete = usePermission(PermissionAction.USER_DELETE);

  const roleColors: Record<UserRole, string> = {
    TECHNICIAN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    SUPERVISOR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    ACCOUNTANT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    OPERATIONS_MANAGER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    FACTORY_SUPERVISOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    SALES_REP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    CLIENT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    HR: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  };

  const roleLabels: Record<UserRole, string> = {
    TECHNICIAN: "Technician",
    SUPERVISOR: "Supervisor",
    ADMIN: "Admin",
    ACCOUNTANT: "Accountant",
    OPERATIONS_MANAGER: "Operations Manager",
    FACTORY_SUPERVISOR: "Factory Supervisor",
    SALES_REP: "Sales Rep",
    CLIENT: "Client",
    HR: "HR",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">View and manage all team members and their statistics</p>
        </div>
        {canCreate && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-all h-full relative group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{member.name}</CardTitle>
                    <CardDescription className="text-xs truncate">{member.email}</CardDescription>
                  </div>
                </div>
                <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Status */}
                {member.stats.isCheckedIn ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Checked In</span>
                    {member.stats.checkInTime && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(member.stats.checkInTime)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Not Checked In</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{member.stats.workingDays}</div>
                    <div className="text-xs text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{member.stats.totalHours}h</div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{member.stats.overtimeHours}h</div>
                    <div className="text-xs text-muted-foreground">Overtime</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Link href={`/team/members/${member.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(member, e)}
                      className="flex-shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDelete(member, e)}
                      className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
              {searchQuery && <p className="text-sm mt-2">Try a different search term</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update team member information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <RoleAssignmentGuard targetRole={UserRole.HR}>
                    <SelectItem value="HR">HR</SelectItem>
                  </RoleAssignmentGuard>
                  <RoleAssignmentGuard targetRole={UserRole.OPERATIONS_MANAGER}>
                    <SelectItem value="OPERATIONS_MANAGER">Operations Manager</SelectItem>
                  </RoleAssignmentGuard>
                  <RoleAssignmentGuard targetRole={UserRole.ACCOUNTANT}>
                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  </RoleAssignmentGuard>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                placeholder="Enter department (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit-specialization">Specialization</Label>
              <Input
                id="edit-specialization"
                value={editFormData.specialization}
                onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                placeholder="Enter specialization (optional)"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (leave empty to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Enter new password (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>Create a new team member account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="add-password">Password *</Label>
              <Input
                id="add-password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
              />
            </div>
            <div>
              <Label htmlFor="add-confirm-password">Confirm Password *</Label>
              <Input
                id="add-confirm-password"
                type="password"
                value={addFormData.confirmPassword}
                onChange={(e) => setAddFormData({ ...addFormData, confirmPassword: e.target.value })}
                placeholder="Confirm password"
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                type="tel"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                placeholder="Enter phone number (optional)"
              />
            </div>
            <div>
              <Label htmlFor="add-role">Role *</Label>
              <Select
                value={addFormData.role}
                onValueChange={(value) => setAddFormData({ ...addFormData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="OPERATIONS_MANAGER">Operations Manager</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-department">Department</Label>
              <Input
                id="add-department"
                value={addFormData.department}
                onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                placeholder="Enter department (optional)"
              />
            </div>
            <div>
              <Label htmlFor="add-specialization">Specialization</Label>
              <Input
                id="add-specialization"
                value={addFormData.specialization}
                onChange={(e) => setAddFormData({ ...addFormData, specialization: e.target.value })}
                placeholder="Enter specialization (optional)"
              />
            </div>
            <div>
              <Label htmlFor="add-status">Status *</Label>
              <Select
                value={addFormData.isActive ? "active" : "inactive"}
                onValueChange={(value) => setAddFormData({ ...addFormData, isActive: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteMember?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
