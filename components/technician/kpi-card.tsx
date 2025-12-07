"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, CheckCircle, Star, DollarSign } from "lucide-react";

interface KPICardProps {
  kpi: {
    attendance: {
      totalDays: number;
      daysPresent: number;
      attendanceRate: string;
    };
    hours: {
      totalHours: string;
      overtimeHours: string;
      averageHoursPerDay: string;
    };
    tasks: {
      total: number;
      completed: number;
      inProgress: number;
      pending: number;
      completionRate: string;
    };
    performance: {
      averageRating: string;
      totalReviews: number;
    };
    overallScore: string;
  };
}

export function KPICard({ kpi }: KPICardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Attendance Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Attendance Rate</CardDescription>
          <CardTitle className="text-3xl font-bold">
            {parseFloat(kpi.attendance.attendanceRate).toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={parseFloat(kpi.attendance.attendanceRate)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {kpi.attendance.daysPresent} / {kpi.attendance.totalDays} days
          </p>
        </CardContent>
      </Card>

      {/* Total Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Hours</CardDescription>
          <CardTitle className="text-3xl font-bold">
            {parseFloat(kpi.hours.totalHours).toFixed(1)}h
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Avg: {parseFloat(kpi.hours.averageHoursPerDay).toFixed(1)}h/day</span>
          </div>
          {parseFloat(kpi.hours.overtimeHours) > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600 mt-1">
              <TrendingUp className="h-4 w-4" />
              <span>Overtime: {parseFloat(kpi.hours.overtimeHours).toFixed(1)}h</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Task Completion</CardDescription>
          <CardTitle className="text-3xl font-bold">
            {parseFloat(kpi.tasks.completionRate).toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={parseFloat(kpi.tasks.completionRate)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {kpi.tasks.completed} / {kpi.tasks.total} tasks
          </p>
        </CardContent>
      </Card>

      {/* Average Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Average Rating</CardDescription>
          <CardTitle className="text-3xl font-bold">
            {parseFloat(kpi.performance.averageRating).toFixed(1)}/5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>{kpi.performance.totalReviews} reviews</span>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card className="md:col-span-2 lg:col-span-4 border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Performance Score</span>
            <span className="text-4xl font-bold text-primary">
              {parseFloat(kpi.overallScore).toFixed(1)}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={parseFloat(kpi.overallScore)} className="h-3" />
        </CardContent>
      </Card>
    </div>
  );
}

