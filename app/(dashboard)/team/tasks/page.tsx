"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/technician/task-card";
import { Loader2, Plus, Filter, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  // Only Admin, Operations Manager, and Supervisor can create tasks
  // Use RBAC permission check instead of role check
  const canCreateTask = usePermission(PermissionAction.TASK_CREATE);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/tasks?${params}`);
      const result = await response.json();

      if (result.success) {
        const fetchedTasks = result.data.tasks;
        setTasks(fetchedTasks);
        setPagination(result.data.pagination);
        
        // Use stats from API (calculated for all tasks, not just current page)
        if (result.data.stats) {
          setStats({
            total: result.data.stats.total,
            pending: result.data.stats.pending,
            inProgress: result.data.stats.inProgress,
            completed: result.data.stats.completed,
          });
        } else {
          // Fallback: calculate from fetched tasks if stats not available
          setStats({
            total: result.data.pagination.total,
            pending: fetchedTasks.filter((t: any) => t.status === "PENDING").length,
            inProgress: fetchedTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
            completed: fetchedTasks.filter((t: any) => t.status === "COMPLETED").length,
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load tasks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && tasks.length === 0) {
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
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">Manage and track all your assigned tasks</p>
        </div>
        {/* Only show "New Task" button if user has permission to create tasks */}
        {canCreateTask && (
          <Link href="/team/tasks/new">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            disabled={pagination.page === 1}
            onClick={() => fetchTasks(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchTasks(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

