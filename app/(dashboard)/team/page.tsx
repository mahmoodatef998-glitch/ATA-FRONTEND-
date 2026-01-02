"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckInOut } from "@/components/technician/check-in-out";
import { KPICard } from "@/components/technician/kpi-card";
import { Users, CheckCircle, Clock, TrendingUp, Package, FileText, XCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { useI18n } from "@/lib/i18n/context";
import { useTeamStats } from "@/lib/hooks/use-team-stats";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useKPI } from "@/lib/hooks/use-kpi";
import { TeamDashboardSkeleton } from "@/components/loading-skeletons/team-dashboard-skeleton";

export default function TeamDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();

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

  // React Query hooks - only fetch when authenticated
  const isAuthenticated = status === "authenticated" && !!session?.user;

  // For Technicians - Dashboard stats
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    status: ["PENDING", "IN_PROGRESS", "COMPLETED"],
    limit: 100,
    enabled: isAuthenticated && isTechnician,
  });

  const { data: kpiData, isLoading: kpiLoading } = useKPI();

  // For Supervisors/Admins - Team stats
  const { data: teamStatsData, isLoading: teamStatsLoading } = useTeamStats();

  // Calculate stats from tasks data
  const stats = useMemo(() => {
    if (!tasksData?.tasks) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    }
    const allTasks = tasksData.tasks;
    return {
      total: allTasks.length,
      pending: allTasks.filter((t: any) => t.status === "PENDING").length,
      inProgress: allTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      completed: allTasks.filter((t: any) => t.status === "COMPLETED").length,
    };
  }, [tasksData]);

  // Extract team stats and attendance details
  const teamStats = useMemo(() => {
    if (!teamStatsData) {
      return {
        totalTechnicians: 0,
        checkedIn: 0,
        checkedOut: 0,
        notCheckedIn: 0,
        pendingTasks: 0,
        pendingOvertime: 0,
      };
    }
    return {
      totalTechnicians: teamStatsData.total || 0,
      checkedIn: teamStatsData.checkedIn || 0,
      checkedOut: teamStatsData.checkedOut || 0,
      notCheckedIn: teamStatsData.notCheckedIn || 0,
      pendingTasks: 0, // Will be fetched separately if needed
      pendingOvertime: 0, // Will be fetched separately if needed
    };
  }, [teamStatsData]);

  const attendanceDetails = useMemo(() => {
    if (!teamStatsData) {
      return {
        checkedInUsers: [],
        checkedOutUsers: [],
        notCheckedInUsers: [],
      };
    }
    return {
      checkedInUsers: teamStatsData.checkedInUsers || [],
      checkedOutUsers: teamStatsData.checkedOutUsers || [],
      notCheckedInUsers: teamStatsData.notCheckedInUsers || [],
    };
  }, [teamStatsData]);

  // ✅ Performance: Disable RSC prefetching - causes excessive _rsc requests
  // Client-side navigation is fast enough with React Query cache
  // const handlePrefetch = useCallback((path: string) => {
  //   router.prefetch(path);
  // }, [router]);

  // Loading state
  const loading = (isTechnician && (tasksLoading || kpiLoading)) || 
                  (isSupervisor && teamStatsLoading);

  if (loading || !isAuthenticated) {
    return <TeamDashboardSkeleton />;
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
        {kpiData?.kpi && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance Overview</h2>
            <KPICard kpi={kpiData.kpi} />
          </div>
        )}

        {/* Quick Link to My Tasks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">{t('team.myTasks')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('team.viewManageTasks')}
                </p>
              </div>
              <Link href="/team/technician">
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  {t('team.goToMyTasks')}
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
        <h1 className="text-3xl font-bold">{t('team.title')}</h1>
        <p className="text-muted-foreground">{t('team.manageTeam')}</p>
      </div>

      {/* Check In/Out - For all employees except Admin */}
      {canCheckInOut && <CheckInOut />}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.teamMembers')}</CardDescription>
            <CardTitle className="text-2xl font-bold">{teamStats.totalTechnicians}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              {t('team.teamMembers')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.checkedIn')}</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">{teamStats.checkedIn}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-1" />
              {t('team.activeNow')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.checkedOut')}</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{teamStats.checkedOut}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {t('team.leftToday')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.notCheckedIn')}</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600">{teamStats.notCheckedIn}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 mr-1" />
              {t('team.absentToday')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.pendingTasks')}</CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">{teamStats.pendingTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-1" />
              {t('team.needsAttention')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('team.pendingOvertime')}</CardDescription>
            <CardTitle className="text-2xl font-bold text-orange-600">{teamStats.pendingOvertime}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {t('team.awaitingApproval')}
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
              {t('team.checkedIn')} ({attendanceDetails.checkedInUsers.length})
            </CardTitle>
            <CardDescription>{t('team.checkedInUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.checkedInUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('team.noOneCheckedIn')}</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.checkedInUsers.map((user: { id: number; name: string; email: string; checkInTime: string }) => (
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
                      <p className="text-xs text-muted-foreground">{t('common.since')}</p>
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
              {t('team.checkedOut')} ({attendanceDetails.checkedOutUsers.length})
            </CardTitle>
            <CardDescription>{t('team.checkedOutUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.checkedOutUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('team.noOneCheckedOut')}</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.checkedOutUsers.map((user: { id: number; name: string; email: string; checkInTime: string; checkOutTime: string }) => (
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
                      <p className="text-xs text-muted-foreground">{t('common.outAt')}</p>
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
              {t('team.notCheckedIn')} ({attendanceDetails.notCheckedInUsers.length})
            </CardTitle>
            <CardDescription>{t('team.notCheckedInUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDetails.notCheckedInUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('team.everyoneCheckedIn')}</p>
            ) : (
              <div className="space-y-2">
                {attendanceDetails.notCheckedInUsers.map((user: { id: number; name: string; email: string }) => (
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
            <Link 
              href="/team/tasks"
              prefetch={false}
            >
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Tasks Management
              </Button>
            </Link>
            <Link 
              href="/team/attendance"
              prefetch={false}
            >
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Attendance History
              </Button>
            </Link>
            <Link 
              href="/team/kpi"
              prefetch={false}
            >
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance KPI
              </Button>
            </Link>
            {(isSupervisor || isAccountant) && (
              <Link 
                href="/team/members"
                prefetch={false}
              >
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
