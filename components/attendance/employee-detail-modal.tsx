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
import { Loader2, Clock, MapPin, Package, User, CheckCircle, XCircle, TrendingUp, Download } from "lucide-react";
import { formatTime, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmployeeDetailModalProps {
  employeeId: number;
  date: string; // YYYY-MM-DD format
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDetailModal({ employeeId, date, isOpen, onClose }: EmployeeDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employeeId && date) {
      fetchEmployeeDetails();
    }
  }, [isOpen, employeeId, date]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch attendance for specific employee and date
      const response = await fetch(`/api/attendance/date?date=${date}&userId=${employeeId}`);
      const result = await response.json();

      if (result.success && result.data.attendances && result.data.attendances.length > 0) {
        const attendanceRecord = result.data.attendances[0];
        const employee = attendanceRecord.users;
        
        // Calculate hours worked and overtime
        let hoursWorked = null;
        let overtime = null;
        if (attendanceRecord.checkOutTime && attendanceRecord.checkInTime) {
          hoursWorked = (new Date(attendanceRecord.checkOutTime).getTime() - new Date(attendanceRecord.checkInTime).getTime()) / (1000 * 60 * 60);
          overtime = hoursWorked > 8 ? hoursWorked - 8 : 0;
        } else if (attendanceRecord.checkInTime) {
          // Still checked in
          hoursWorked = (new Date().getTime() - new Date(attendanceRecord.checkInTime).getTime()) / (1000 * 60 * 60);
          overtime = hoursWorked > 8 ? hoursWorked - 8 : 0;
        }
        
        setData({
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            department: employee.department,
            specialization: employee.specialization,
            profilePicture: null,
          },
          attendance: {
            ...attendanceRecord,
            hoursWorked,
            overtime,
            tasks: attendanceRecord.attendanceTasks || [],
          },
        });
      } else {
        // Employee might not have attendance for this date - fetch user info
        const userResponse = await fetch(`/api/users?role=TECHNICIAN&role=SUPERVISOR`);
        const userResult = await userResponse.json();
        
        if (userResult.success && userResult.data) {
          // API returns { success: true, data: { users: [...], pagination: {...} } }
          const users = userResult.data?.users || (Array.isArray(userResult.data) ? userResult.data : []);
          const employee = Array.isArray(users) ? users.find((u: any) => u.id === employeeId) : null;
          
          if (employee) {
            setData({
              employee: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                department: employee.department,
                specialization: employee.specialization,
                profilePicture: employee.profilePicture,
              },
              attendance: null, // No attendance for this date
            });
          } else {
            setError("Employee not found");
          }
        } else {
          setError("Employee not found");
        }
      }
    } catch (err: any) {
      console.error("Error fetching employee details:", err);
      setError(err.message || "Failed to load employee details");
    } finally {
      setLoading(false);
    }
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

  if (!data) {
    return null;
  }

  const { employee, attendance } = data;
  const isPresent = attendance !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isPresent ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {employee.profilePicture ? (
                  <img
                    src={employee.profilePicture}
                    alt={employee.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className={`h-5 w-5 ${isPresent ? "text-green-600" : "text-red-600"}`} />
                )}
              </div>
              <div>
                <div>{employee.name}</div>
                <DialogDescription>
                  {employee.email} • {employee.role}
                  {employee.department && ` • ${employee.department}`}
                </DialogDescription>
              </div>
            </DialogTitle>
            {isPresent && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `/api/attendance/export?userId=${employeeId}&date=${date}&period=day`;
                    window.open(url, "_blank");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `/api/attendance/export?userId=${employeeId}&date=${date}&period=month`;
                    window.open(url, "_blank");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Month
                </Button>
              </div>
            )}
          </div>
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
        ) : !isPresent ? (
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-600 mb-2">Absent Today</p>
            <p className="text-sm text-muted-foreground">
              No attendance record for {formatDateTime(date)}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Attendance Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Hours Worked & Overtime */}
                {attendance.hoursWorked !== null && (
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hours Worked</p>
                        <p className="text-lg font-bold text-blue-600">
                          {attendance.hoursWorked.toFixed(2)}h
                        </p>
                      </div>
                    </div>
                    {attendance.overtime !== null && attendance.overtime > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Overtime</p>
                          <p className="text-lg font-bold text-orange-600">
                            +{attendance.overtime.toFixed(2)}h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks */}
            {attendance.tasks && Array.isArray(attendance.tasks) && attendance.tasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Tasks ({attendance.tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(attendance.tasks) ? attendance.tasks.map((at: any) => (
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
                          <div className="grid gap-2 md:grid-cols-2 text-xs text-muted-foreground mt-2">
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
                            {at.performedAt && (
                              <div>
                                <span>Started: {formatTime(at.performedAt)}</span>
                              </div>
                            )}
                            {at.completedAt && (
                              <div>
                                <span>Completed: {formatTime(at.completedAt)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )) : null}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tasks assigned for this day</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

