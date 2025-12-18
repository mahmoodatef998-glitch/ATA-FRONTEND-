"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/technician/kpi-card";
import { Loader2, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";
import { UserRole } from "@prisma/client";

export default function KPIPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<any>(null);
  const [teamKPI, setTeamKPI] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"individual" | "team">("individual");
  const [period, setPeriod] = useState("thisMonth");

  const fetchKPI = useCallback(async () => {
    try {
      setLoading(true);

      let startDate: string | null = null;
      let endDate: string | null = null;

      const now = new Date();
      switch (period) {
        case "thisWeek":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          // Use local date to avoid timezone issues
          startDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
          endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          break;
        case "thisMonth":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-${String(monthStart.getDate()).padStart(2, "0")}`;
          endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          break;
        case "lastMonth":
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = `${lastMonthStart.getFullYear()}-${String(lastMonthStart.getMonth() + 1).padStart(2, "0")}-${String(lastMonthStart.getDate()).padStart(2, "0")}`;
          endDate = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(lastMonthEnd.getDate()).padStart(2, "0")}`;
          break;
      }

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      if (viewMode === "individual") {
        const response = await fetch(`/api/kpi?${params}`);
        const result = await response.json();
        if (result.success) {
          setKpi(result.data.kpi);
        }
      } else {
        const response = await fetch(`/api/kpi/team?${params}`);
        const result = await response.json();
        if (result.success) {
          setTeamKPI(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching KPI:", error);
      toast({
        title: "Error",
        description: "Failed to load KPI data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, period, viewMode]);

  useStableAsyncEffect(() => {
    fetchKPI();
  }, [fetchKPI]);

  const canViewTeam = session?.user?.role === UserRole.SUPERVISOR || session?.user?.role === UserRole.ADMIN;

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
          <h1 className="text-3xl font-bold">KPI Dashboard</h1>
          <p className="text-muted-foreground">Track performance metrics and statistics</p>
        </div>
        <div className="flex items-center gap-4">
          {canViewTeam && (
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "individual" && kpi ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Performance</h2>
          <KPICard kpi={kpi} />
        </div>
      ) : viewMode === "team" && teamKPI ? (
        <div className="space-y-6">
          {/* Team Averages */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Averages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <CardDescription>Attendance Rate</CardDescription>
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

          {/* Individual KPIs */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Team Members</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamKPI.team.map((member: any) => (
                <Card key={member.user.id}>
                  <CardHeader>
                    <CardTitle>{member.user.name}</CardTitle>
                    <CardDescription>{member.user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Attendance:</span>
                        <span className="font-medium">{member.kpi.attendanceRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-medium">{member.kpi.totalHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasks:</span>
                        <span className="font-medium">
                          {member.kpi.tasksCompleted}/{member.kpi.tasksTotal}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-medium">{member.kpi.averageRating}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No KPI data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

