"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, MapPin, CheckCircle, XCircle, Package, User, TrendingUp } from "lucide-react";
import { formatTime, formatDate, formatDateTime } from "@/lib/utils";
import { UserRole } from "@prisma/client";

interface DateDetailModalProps {
  date: string; // YYYY-MM-DD format
  isOpen: boolean;
  onClose: () => void;
}

export function DateDetailModal({ date, isOpen, onClose }: DateDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && date) {
      fetchDateData();
    }
  }, [isOpen, date]);

  const fetchDateData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/attendance/date?date=${date}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load attendance data");
      }
    } catch (err: any) {
      console.error("Error fetching date data:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (attendance: any) => {
    if (attendance.checkOutTime === null) {
      return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Checked Out</Badge>;
  };

  const getTaskStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[priority] || "bg-gray-100 text-gray-800"}>{priority}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance Details - {formatDate(date)}</DialogTitle>
          <DialogDescription>
            View all attendance records and tasks for this date
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : data && data.attendances.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Employees</CardDescription>
                  <CardTitle className="text-2xl font-bold">{data.stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Checked In</CardDescription>
                  <CardTitle className="text-2xl font-bold text-green-600">{data.stats.checkedIn}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Checked Out</CardDescription>
                  <CardTitle className="text-2xl font-bold text-blue-600">{data.stats.checkedOut}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Hours</CardDescription>
                  <CardTitle className="text-2xl font-bold">{data.stats.totalHours.toFixed(2)}h</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Individual Attendance Records */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Employee Attendance</h3>
              {data.attendances.map((attendance: any) => {
                const hoursWorked = attendance.checkOutTime && attendance.checkInTime
                  ? (new Date(attendance.checkOutTime).getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60)
                  : null;

                return (
                  <Card key={attendance.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{attendance.users.name}</CardTitle>
                            <CardDescription>
                              {attendance.users.email} • {attendance.users.role}
                              {attendance.users.department && ` • ${attendance.users.department}`}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(attendance)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Check-in/Check-out Times */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Check-in</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(attendance.checkInTime)}
                            </p>
                            {attendance.checkInLocation && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{attendance.checkInLocation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {attendance.checkOutTime ? (
                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Check-out</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(attendance.checkOutTime)}
                              </p>
                              {attendance.checkOutLocation && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">{attendance.checkOutLocation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm text-muted-foreground">Still checked in</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hours Worked */}
                      {hoursWorked !== null && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Hours Worked: <span className="text-blue-600">{hoursWorked.toFixed(2)}h</span>
                            {hoursWorked > 8 && (
                              <span className="text-orange-600 ml-2">
                                (Overtime: {(hoursWorked - 8).toFixed(2)}h)
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Tasks */}
                      {attendance.attendanceTasks && attendance.attendanceTasks.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Tasks ({attendance.attendanceTasks.length})
                            </p>
                          </div>
                          <div className="space-y-2">
                            {attendance.attendanceTasks.map((at: any) => (
                              <Card key={at.id} className="bg-gray-50">
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium">{at.task?.title || "Unknown Task"}</p>
                                      {at.task?.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {at.task.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {at.task?.status && getTaskStatusBadge(at.task.status)}
                                      {at.task?.priority && getPriorityBadge(at.task.priority)}
                                    </div>
                                  </div>
                                  <div className="grid gap-2 md:grid-cols-2 text-xs text-muted-foreground">
                                    {at.task?.deadline && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Deadline: {formatDateTime(at.task.deadline)}</span>
                                      </div>
                                    )}
                                    {at.task?.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{at.task.location}</span>
                                      </div>
                                    )}
                                    {at.task?.estimatedHours && (
                                      <div>
                                        <span>Estimated: {at.task.estimatedHours}h</span>
                                      </div>
                                    )}
                                    {at.task?.actualHours && (
                                      <div>
                                        <span>Actual: {at.task.actualHours}h</span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No tasks assigned for this day
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No data for this day</p>
            <p className="text-sm text-muted-foreground">No attendance records found for {formatDate(date)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

