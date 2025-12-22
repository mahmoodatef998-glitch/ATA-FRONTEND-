"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CheckCircle, Clock, AlertCircle, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { UserRole } from "@prisma/client";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teamStatus, setTeamStatus] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [pendingOvertime, setPendingOvertime] = useState<any[]>([]);
  const [teamKPI, setTeamKPI] = useState<any>(null);

  useEffect(() => {
    // Redirect Admin to /team (they shouldn't access supervisor dashboard)
    if (status === "authenticated" && session?.user) {
      if (session.user.role === UserRole.ADMIN) {
        router.push("/team");
        return;
      }
      // Only supervisors can access this page
      if (session.user.role !== UserRole.SUPERVISOR) {
        router.push("/team");
        return;
      }
    }
    fetchData();
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch team status (technicians with current attendance)
      const techniciansResponse = await fetch("/api/users?role=TECHNICIAN");
      // Note: This endpoint doesn't exist yet, we'll need to create it or use a different approach
      // For now, we'll fetch tasks and get unique assigned users

      // Fetch pending tasks
      const tasksResponse = await fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&limit=10");
      const tasksResult = await tasksResponse.json();
      if (tasksResult.success) {
        setPendingTasks(tasksResult.data.tasks);
      }

      // Fetch pending overtime
      const overtimeResponse = await fetch("/api/overtime?approved=false&limit=10");
      const overtimeResult = await overtimeResponse.json();
      if (overtimeResult.success) {
        setPendingOvertime(overtimeResult.data.overtime);
      }

      // Fetch team KPI
      const kpiResponse = await fetch("/api/kpi/team");
      const kpiResult = await kpiResponse.json();
      if (kpiResult.success) {
        setTeamKPI(kpiResult.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOvertime = async (overtimeId: number) => {
    try {
      const response = await fetch(`/api/overtime/${overtimeId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: true }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "✅ Overtime approved",
          description: "Overtime request has been approved",
          className: "bg-green-50 border-green-200",
        });
        fetchData();
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to approve overtime",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving overtime:", error);
      toast({
        title: "❌ Error",
        description: "Failed to approve overtime",
        variant: "destructive",
      });
    }
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
      <div>
        <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">Manage your team and track performance</p>
      </div>

      {/* Team KPI Overview */}
      {teamKPI && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <CardDescription>Avg Attendance Rate</CardDescription>
                <CardTitle className="text-2xl">{teamKPI.averages.attendanceRate}%</CardTitle>
              </div>
              <div>
                <CardDescription>Avg Hours</CardDescription>
                <CardTitle className="text-2xl">{teamKPI.averages.totalHours}h</CardTitle>
              </div>
              <div>
                <CardDescription>Tasks Completed</CardDescription>
                <CardTitle className="text-2xl">
                  {teamKPI.averages.tasksCompleted} / {teamKPI.averages.tasksTotal}
                </CardTitle>
              </div>
              <div>
                <CardDescription>Avg Rating</CardDescription>
                <CardTitle className="text-2xl">{teamKPI.averages.averageRating}/5</CardTitle>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Pending Tasks ({pendingTasks.length})</h2>
          <Link href="/team/tasks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Task
            </Button>
          </Link>
        </div>
        {pendingTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{task.assignedTo.name}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(task.deadline)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/team/tasks/${task.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending tasks</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Overtime Approvals */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Pending Overtime Approvals ({pendingOvertime.length})
        </h2>
        {pendingOvertime.length > 0 ? (
          <div className="space-y-4">
            {pendingOvertime.map((overtime: any) => (
              <Card key={overtime.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{overtime.users.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {overtime.hours} hours on {new Date(overtime.date).toLocaleDateString()}
                        </span>
                      </div>
                      {overtime.reason && (
                        <p className="text-sm text-muted-foreground">{overtime.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveOvertime(overtime.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          const response = await fetch(`/api/overtime/${overtime.id}/approve`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ approved: false }),
                          });
                          if (response.ok) {
                            fetchData();
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending overtime approvals</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/team/tasks">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Tasks</h3>
                  <p className="text-sm text-muted-foreground">Assign and track tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/team/kpi">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Team KPI</h3>
                  <p className="text-sm text-muted-foreground">View performance metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/team/attendance">
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Attendance</h3>
                  <p className="text-sm text-muted-foreground">View team attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

