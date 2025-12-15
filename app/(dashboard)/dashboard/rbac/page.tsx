/**
 * RBAC Management Page
 * Admin-only page for managing roles and permissions
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@prisma/client";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, FileText, Eye, EyeOff } from "lucide-react";
import { useIsAdmin } from "@/lib/permissions/hooks";

interface RolePermissions {
  role: UserRole;
  permissions: PermissionAction[];
  permissionCount: number;
}

interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userRole: UserRole | null;
  action: string;
  resource: string;
  resourceId: number | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  users: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export default function RBACManagementPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<UserRole>>(new Set());

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchRoles();
      fetchAuditLogs();
    }
  }, [status, isAdmin]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rbac/roles");
      const result = await response.json();

      if (result.success) {
        setRoles(result.data.roles);
        setAllPermissions(result.data.allPermissions);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const response = await fetch("/api/rbac/audit-logs?limit=50");
      const result = await response.json();

      if (result.success) {
        setAuditLogs(result.data.logs);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch audit logs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleRoleExpansion = (role: UserRole) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(role)) {
      newExpanded.delete(role);
    } else {
      newExpanded.add(role);
    }
    setExpandedRoles(newExpanded);
  };

  const getPermissionCategory = (permission: PermissionAction): string => {
    const permString = String(permission);
    if (permString.startsWith("user.")) return "Users";
    if (permString.startsWith("role.")) return "Users";
    if (permString.startsWith("client.")) return "Clients";
    if (permString.startsWith("lead.")) return "Leads";
    if (permString.startsWith("task.")) return "Tasks";
    if (permString.startsWith("attendance.")) return "Attendance";
    if (permString.startsWith("invoice.")) return "Finance";
    if (permString.startsWith("payment.")) return "Finance";
    if (permString.startsWith("finance.")) return "Finance";
    if (permString.startsWith("hr.")) return "HR";
    if (permString.startsWith("payroll.")) return "HR";
    if (permString.startsWith("report.")) return "Reports";
    if (permString.startsWith("file.")) return "Files";
    if (permString.startsWith("setting.")) return "System";
    if (permString.startsWith("audit.")) return "System";
    // Legacy mappings
    if (permString.startsWith("team.")) return "Users";
    if (permString.startsWith("tasks.")) return "Tasks";
    if (permString.startsWith("orders.")) return "Leads";
    if (permString.startsWith("clients.")) return "Clients";
    if (permString.startsWith("invoices.")) return "Finance";
    if (permString.startsWith("quotations.")) return "Finance";
    if (permString.startsWith("access.")) return "System";
    if (permString.startsWith("reports.")) return "Reports";
    return "Other";
  };

  const groupPermissionsByCategory = (permissions: PermissionAction[]) => {
    const grouped: Record<string, PermissionAction[]> = {};
    permissions.forEach((perm) => {
      const category = getPermissionCategory(perm);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    });
    return grouped;
  };

  const formatAction = (action: string): string => {
    return action
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).replace(/_/g, " "))
      .join(" ");
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page. Only administrators can manage roles and permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role-Based Access Control (RBAC)
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage roles and permissions for your team members
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/rbac/roles">
            <Button variant="outline">
              Manage Roles
            </Button>
          </Link>
          <Link href="/dashboard/rbac/audit">
            <Button variant="outline">
              View Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles Overview</CardTitle>
              <CardDescription>
                View and manage permissions for each role in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((roleData) => {
                const isExpanded = expandedRoles.has(roleData.role);
                const groupedPermissions = groupPermissionsByCategory(roleData.permissions);

                return (
                  <Card key={roleData.role} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">
                            {roleData.role.replace("_", " ")}
                          </CardTitle>
                          <Badge variant="secondary">
                            {roleData.permissionCount} permissions
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRoleExpansion(roleData.role)}
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {Object.entries(groupedPermissions).map(([category, perms]) => (
                            <div key={category}>
                              <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                                {category}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((perm) => (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {formatAction(perm)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              For detailed audit log viewing with filters and pagination, please visit:
            </p>
            <Button onClick={() => window.location.href = "/dashboard/rbac/audit"}>
              Open Audit Logs Viewer
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

