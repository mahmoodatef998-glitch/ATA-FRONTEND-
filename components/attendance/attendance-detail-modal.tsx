"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, MapPin, Package, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/utils";

interface AttendanceDetailModalProps {
  attendanceId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceDetailModal({
  attendanceId,
  isOpen,
  onClose,
}: AttendanceDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);

  const fetchAttendanceDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/${attendanceId}`);
      const result = await response.json();

      if (result.success) {
        setAttendance(result.data);
      }
    } catch (error) {
      console.error("Error fetching attendance details:", error);
    } finally {
      setLoading(false);
    }
  }, [attendanceId]);

  useEffect(() => {
    if (isOpen && attendanceId) {
      fetchAttendanceDetails();
    }
  }, [isOpen, attendanceId, fetchAttendanceDetails]);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {attendance && formatDate(attendance.date)}
          </DialogTitle>
          <DialogDescription>Detailed attendance and tasks information</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : attendance ? (
          <div className="space-y-4">
            {/* Performance Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Daily Performance</span>
                  <Badge
                    variant="outline"
                    className={`text-lg ${getPerformanceColor(attendance.performanceScore)}`}
                  >
                    {attendance.performanceScore}%
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Attendance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Check-in</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        {formatDateTime(attendance.checkInTime)}
                      </span>
                    </div>
                    {attendance.checkInLocation && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{attendance.checkInLocation}</span>
                      </div>
                    )}
                  </div>

                  {attendance.checkOutTime ? (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Check-out</div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="font-medium">
                          {formatDateTime(attendance.checkOutTime)}
                        </span>
                      </div>
                      {attendance.checkOutLocation && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{attendance.checkOutLocation}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        Still Working
                      </Badge>
                    </div>
                  )}
                </div>

                {attendance.checkInTime && attendance.checkOutTime && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hours Worked:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(
                          (new Date(attendance.checkOutTime).getTime() -
                            new Date(attendance.checkInTime).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(2)}h
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <Badge variant="outline" className={getTaskStatusColor(attendance.status)}>
                    {attendance.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Details */}
            {attendance.attendanceTasks && attendance.attendanceTasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Tasks ({attendance.attendanceTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendance.attendanceTasks.map((at: any) => (
                      <div
                        key={at.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{at.task.title}</span>
                            </div>
                            {at.task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {at.task.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={getTaskStatusColor(at.status)}
                          >
                            {at.status}
                          </Badge>
                        </div>

                        {/* Task Timings */}
                        {(at.performedAt || at.completedAt) && (
                          <div className="grid md:grid-cols-2 gap-3 mb-3 text-sm">
                            {at.performedAt && (
                              <div>
                                <div className="text-muted-foreground mb-1">Started</div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(at.performedAt)}</span>
                                </div>
                              </div>
                            )}
                            {at.completedAt && (
                              <div>
                                <div className="text-muted-foreground mb-1">Completed</div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(at.completedAt)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Performance Rating */}
                        {at.performance && (
                          <div className="mb-3">
                            <div className="text-sm text-muted-foreground mb-1">Performance Rating</div>
                            <div className="flex items-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 rounded ${
                                    i < at.performance
                                      ? "bg-yellow-400"
                                      : "bg-gray-200"
                                  }`}
                                />
                              ))}
                              <span className="text-sm font-medium ml-2">
                                {at.performance}/5
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {at.note && (
                          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                            <div className="text-muted-foreground mb-1">Notes:</div>
                            <p>{at.note}</p>
                          </div>
                        )}

                        {/* Assigned By */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          {at.assignedBy ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>Assigned by: {at.assignedBy.name}</span>
                            </>
                          ) : at.task.assignedBy ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>Task created by: {at.task.assignedBy.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tasks for this day</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

