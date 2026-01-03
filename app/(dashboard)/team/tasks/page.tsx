"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/technician/task-card";
import { Loader2, Plus, Filter, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { useTasks } from "@/lib/hooks/use-tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  // Only Admin, Operations Manager, and Supervisor can create tasks
  // Use RBAC permission check instead of role check
  const canCreateTask = usePermission(PermissionAction.TASK_CREATE);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 30;

  // ✅ Performance: Use React Query for automatic caching and deduplication
  const { data: tasksData, isLoading, error } = useTasks({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit,
    page,
    enabled: sessionStatus === "authenticated",
  });

  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || {
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
  };
  const stats = tasksData?.stats || {
    total: pagination.total,
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to load tasks",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your assigned tasks</p>
        </div>
        {/* Only show "New Task" button if user has permission to create tasks */}
        {canCreateTask && (
          <Link href="/team/tasks/new" prefetch={false}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1); // Reset to first page when filter changes
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* My Tasks Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
        {tasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks assigned yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

