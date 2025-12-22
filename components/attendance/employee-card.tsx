"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Package, User, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { formatTime, formatDateTime } from "@/lib/utils";

interface EmployeeCardProps {
  employee: {
    id: number;
    name: string;
    email: string;
    role: string;
    department?: string | null;
    specialization?: string | null;
    profilePicture?: string | null;
    isPresent: boolean;
    attendance: {
      id: number;
      checkInTime: string;
      checkOutTime: string | null;
      checkInLocation: string | null;
      checkOutLocation: string | null;
      status: string;
      hoursWorked: number | null;
      overtime: number | null;
      tasks: Array<{
        id: number;
        taskId: number;
        status: string;
        task: {
          id: number;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
        };
      }>;
    } | null;
  };
  onClick: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const isPresent = employee.isPresent;
  const attendance = employee.attendance;

  // Calculate task stats
  const totalTasks = attendance?.tasks.length || 0;
  const completedTasks = attendance?.tasks.filter((t) => t.task.status === "COMPLETED").length || 0;

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all ${
        isPresent
          ? "bg-green-50 border-green-300 hover:border-green-400"
          : "bg-red-50 border-red-300 hover:border-red-400"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isPresent ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {employee.profilePicture ? (
                <img
                  src={employee.profilePicture}
                  alt={employee.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <User className={`h-6 w-6 ${isPresent ? "text-green-600" : "text-red-600"}`} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {employee.email}
                {employee.department && ` • ${employee.department}`}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isPresent
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }
          >
            {isPresent ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Present
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Absent Today
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      {isPresent && attendance && (
        <CardContent className="space-y-3">
          {/* Check-in/Check-out Times */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Check-in</span>
              </div>
              <span>{formatTime(attendance.checkInTime)}</span>
            </div>
            {attendance.checkOutTime ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Check-out</span>
                  </div>
                  <span>{formatTime(attendance.checkOutTime)}</span>
                </div>
                {attendance.hoursWorked !== null && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Hours Worked</span>
                    <span className="text-blue-600 font-bold">
                      {attendance.hoursWorked.toFixed(2)}h
                    </span>
                  </div>
                )}
                {attendance.overtime !== null && attendance.overtime > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-orange-600">Overtime</span>
                    <span className="text-orange-600 font-bold">
                      +{attendance.overtime.toFixed(2)}h
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 w-full justify-center">
                <Clock className="h-3 w-3 mr-1" />
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
          {totalTasks > 0 ? (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
                <Badge variant="outline">
                  {completedTasks}/{totalTasks}
                </Badge>
              </div>
              <div className="space-y-1">
                {attendance.tasks.slice(0, 2).map((at) => (
                  <div
                    key={at.id}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                  >
                    <span className="truncate flex-1">{at.task.title}</span>
                    {at.task.status === "COMPLETED" ? (
                      <CheckCircle className="h-3 w-3 text-green-600 ml-2" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-400 ml-2" />
                    )}
                  </div>
                ))}
                {totalTasks > 2 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{totalTasks - 2} more tasks
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t text-sm text-muted-foreground text-center">
              No tasks assigned
            </div>
          )}
        </CardContent>
      )}
      {!isPresent && (
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600">Absent Today</p>
            <p className="text-xs text-muted-foreground mt-1">No attendance record for today</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

