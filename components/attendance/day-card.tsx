"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Package, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface DayCardProps {
  attendance: {
    id: number;
    date: string;
    checkInTime: string;
    checkOutTime: string | null;
    checkInLocation: string | null;
    status: string;
    performanceScore: number;
    attendanceTasks: Array<{
      id: number;
      status: string;
      task: {
        title: string;
      };
    }>;
  };
  onClick: () => void;
}

export function DayCard({ attendance, onClick }: DayCardProps) {
  const isComplete = attendance.checkOutTime !== null;
  const tasksCount = attendance.attendanceTasks?.length || 0;
  const completedTasks = attendance.attendanceTasks?.filter(
    (t) => t.status === "COMPLETED"
  ).length || 0;

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate hours worked
  let hoursWorked: number | null = null;
  if (attendance.checkInTime && attendance.checkOutTime) {
    const checkIn = new Date(attendance.checkInTime);
    const checkOut = new Date(attendance.checkOutTime);
    hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {formatDate(attendance.date)}
          </CardTitle>
          <Badge
            variant="outline"
            className={`${getPerformanceColor(attendance.performanceScore)}`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {attendance.performanceScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Attendance Times */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Check-in</span>
            </div>
            <span>{formatTime(attendance.checkInTime)}</span>
          </div>
          {isComplete ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Check-out</span>
                </div>
                <span>{formatTime(attendance.checkOutTime!)}</span>
              </div>
              {hoursWorked !== null && (
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Hours</span>
                  <span className="text-blue-600 font-bold">
                    {hoursWorked.toFixed(2)}h
                  </span>
                </div>
              )}
            </>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
              Still Working
            </Badge>
          )}
        </div>

        {/* Location */}
        {attendance.checkInLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{attendance.checkInLocation}</span>
          </div>
        )}

        {/* Tasks Summary */}
        {tasksCount > 0 ? (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tasks</span>
              </div>
              <Badge variant="outline">
                {completedTasks}/{tasksCount}
              </Badge>
            </div>
            <div className="space-y-1">
              {attendance.attendanceTasks.slice(0, 3).map((at: any) => (
                <div
                  key={at.id}
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                >
                  <span className="truncate flex-1">{at.task.title}</span>
                  {at.status === "COMPLETED" ? (
                    <CheckCircle className="h-3 w-3 text-green-600 ml-2" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400 ml-2" />
                  )}
                </div>
              ))}
              {tasksCount > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{tasksCount - 3} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t text-sm text-muted-foreground text-center">
            No tasks for this day
          </div>
        )}

        {/* Status */}
        <div className="pt-2 border-t">
          <Badge
            variant="outline"
            className={getStatusColor(attendance.status)}
          >
            {attendance.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

