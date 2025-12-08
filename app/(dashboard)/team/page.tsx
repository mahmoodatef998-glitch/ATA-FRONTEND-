"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckInOut } from "@/components/technician/check-in-out";
import { KPICard } from "@/components/technician/kpi-card";
import { Loader2, Users, CheckCircle, Clock, TrendingUp, Package, MapPin, FileText, XCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

export default function TeamDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  
  // For Technicians - Dashboard stats
  const [kpi, setKpi] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  // For Supervisors/Admins - Team stats
  const [teamStats, setTeamStats] = useState({
    totalTechnicians: 0,
    checkedIn: 0,
    checkedOut: 0,
    notCheckedIn: 0,
    pendingTasks: 0,
    pendingOvertime: 0,
  });
  
  // Attendance details
  const [attendanceDetails, setAttendanceDetails] = useState<{
    checkedInUsers: Array<{ id: number; name: string; email: string; checkInTime: string }>;
    checkedOutUsers: Array<{ id: number; name: string; email: string; checkInTime: string; checkOutTime: string }>;
    notCheckedInUsers: Array<{ id: number; name: string; email: string }>;
  }>({
    checkedInUsers: [],
    checkedOutUsers: [],
    notCheckedInUsers: [],
  });

  // Memoize role checks to prevent unnecessary re-renders
  const isTechnician = useMemo(() => session?.user?.role === UserRole.TECHNICIAN, [session?.user?.role]);
  const isSupervisor = useMemo(() => 
    session?.user?.role === UserRole.SUPERVISOR || 
    session?.user?.role === UserRole.ADMIN ||
    session?.user?.role === UserRole.OPERATIONS_MANAGER ||
    session?.user?.role === UserRole.HR ||
    session?.user?.role === UserRole.ACCOUNTANT,
    [session?.user?.role]
  );
  const isAdmin = useMemo(() => session?.user?.role === UserRole.ADMIN, [session?.user?.role]);
  const isAccountant = useMemo(() => session?.user?.role === UserRole.ACCOUNTANT, [session?.user?.role]);
  const canCheckInOut = useMemo(() => !isAdmin, [isAdmin]);

  // Define fetch functions before useEffect
  const fetchTechnicianData = useCallback(async () => {
    if (!session?.user) return;
    try {
      setLoading(true);

      // Fetch tasks stats
      const tasksResponse = await fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&status=COMPLETED&limit=100");
      const tasksResult = await tasksResponse.json();
      if (tasksResult.success) {
        const allTasks = tasksResult.data.tasks;
        setStats({
          total: allTasks.length,
          pending: allTasks.filter((t: any) => t.status === "PENDING").length,
          inProgress: allTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          completed: allTasks.filter((t: any) => t.status === "COMPLETED").length,
        });
      }

      // Fetch KPI
      const kpiResponse = await fetch("/api/kpi");
      const kpiResult = await kpiResponse.json();
      if (kpiResult.success) {
        setKpi(kpiResult.data.kpi);
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
  }, [session?.user, toast]);

  const fetchTeamStats = useCallback(async () => {
    if (!session?.user) return;
    try {
      setLoading(true);

      // Fetch pending tasks
      const tasksResponse = await fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&limit=100");
      const tasksResult = await tasksResponse.json();
      const tasks = tasksResult.success ? tasksResult.data.tasks : [];

      // Fetch pending overtime
      const overtimeResponse = await fetch("/api/overtime?approved=false&limit=100");
      const overtimeResult = await overtimeResponse.json();
      const overtime = overtimeResult.success ? overtimeResult.data.overtime : [];

      // Fetch attendance statistics (includes team members count)
      const attendanceResponse = await fetch("/api/team/attendance-stats");
      const attendanceResult = await attendanceResponse.json();
      
      if (attendanceResult.success) {
        const { total, checkedIn, checkedOut, notCheckedIn, checkedInUsers, checkedOutUsers, notCheckedInUsers } = attendanceResult.data;
        setTeamStats({
          totalTechnicians: total,
          checkedIn,
          checkedOut,
          notCheckedIn,
          pendingTasks: tasks.length,
          pendingOvertime: overtime.length,
        });
        setAttendanceDetails({
          checkedInUsers: checkedInUsers || [],
          checkedOutUsers: checkedOutUsers || [],
          notCheckedInUsers: notCheckedInUsers || [],
        });
      } else {
        setTeamStats({
          totalTechnicians: 0,
          checkedIn: 0,
          checkedOut: 0,
          notCheckedIn: 0,
          pendingTasks: tasks.length,
          pendingOvertime: overtime.length,
        });
        setAttendanceDetails({
          checkedInUsers: [],
          checkedOutUsers: [],
          notCheckedInUsers: [],
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // useEffect after function definitions
  useEffect(() => {
    // Only run when authenticated
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    // Fetch data based on role
    const userRole = session.user.role;
    if (userRole === UserRole.TECHNICIAN) {
      fetchTechnicianData();
    } else if (
      userRole === UserRole.SUPERVISOR ||
      userRole === UserRole.ADMIN ||
      userRole === UserRole.OPERATIONS_MANAGER ||
      userRole === UserRole.HR ||
      userRole === UserRole.ACCOUNTANT
    ) {
      fetchTeamStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role, pathname]); // Removed fetchTechnicianData and fetchTeamStats from deps to prevent re-renders

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Technician Dashboard
  if (isTechnician) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your tasks and track your performance</p>
        </div>

        {/* Check In/Out */}
        <CheckInOut />

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

        {/* KPI Overview */}
        {kpi && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance Overview</h2>
            <KPICard kpi={kpi} />
          </div>
        )}

        {/* Quick Link to My Tasks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">My Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage all your assigned tasks
                </p>
              </div>
              <Link href="/team/technician">
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  Go to My Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Supervisor/Admin Dashboard (fallback - usually redirected)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Our Team</h1>
        <p className="text-muted-foreground">Manage your team, tasks, and performance</p>
      </div>

      {/* Check In/Out - For all employees except Admin */}
      {canCheckInOut && <CheckInOut />}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-2xl font-bold">{teamStats.totalTechnicians}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              Team Members
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Checked In</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">{teamStats.checkedIn}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-1" />
              Active Now
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Checked Out</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{teamStats.checkedOut}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Left Today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Not Checked In</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600">{teamStats.notCheckedIn}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 mr-1" />
              Absent Today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">{teamStats.pendingTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-1" />
              Needs Attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Overtime</CardDescription>
            <CardTitle className="text-2xl font-bold text-orange-600">{teamStats.pendingOvertime}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Awaiting Approval
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Checked In Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Checked In ({attendanceDetails.checkedInUsers.length})
            </CardTitle>
            <CardDescription>Team members currently active</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.checkedInUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No one is checked in</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.checkedInUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Since</p>
                      <p className="text-xs font-medium">{formatTime(user.checkInTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checked Out Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Checked Out ({attendanceDetails.checkedOutUsers.length})
            </CardTitle>
            <CardDescription>Team members who checked out today</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.checkedOutUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No one has checked out</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.checkedOutUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Out at</p>
                      <p className="text-xs font-medium">{formatTime(user.checkOutTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Not Checked In Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Not Checked In ({attendanceDetails.notCheckedInUsers.length})
            </CardTitle>
            <CardDescription>Team members who haven&apos;t checked in today</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.notCheckedInUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All team members are checked in</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.notCheckedInUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 p-2 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/team/tasks">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">All Tasks</h3>
                  <p className="text-sm text-muted-foreground">Assign and manage tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/team/attendance">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Team Attendance</h3>
                  <p className="text-sm text-muted-foreground">View team attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/team/kpi">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Team KPI</h3>
                  <p className="text-sm text-muted-foreground">View team performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Navigate to different sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/team/tasks">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Tasks Management
              </Button>
            </Link>
            <Link href="/team/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Attendance History
              </Button>
            </Link>
            <Link href="/team/kpi">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance KPI
              </Button>
            </Link>
            {(isSupervisor || isAccountant) && (
              <Link href="/team/members">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Team Members
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
