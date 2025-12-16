"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  CalendarDays,
  Package,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { DayCard } from "@/components/attendance/day-card";
import { EmployeeCard } from "@/components/attendance/employee-card";
import { AttendanceDetailModal } from "@/components/attendance/attendance-detail-modal";
import { DateDetailModal } from "@/components/attendance/date-detail-modal";
import { EmployeeDetailModal } from "@/components/attendance/employee-detail-modal";
import { MonthCalendar } from "@/components/attendance/month-calendar";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendancePage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [monthStart, setMonthStart] = useState<Date | null>(null);
  const [monthEnd, setMonthEnd] = useState<Date | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
  
  // Date filters - Default to current month (will be overridden by latest month)
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // Default selected date (today)
  const [defaultSelectedDate, setDefaultSelectedDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  
  // User filter (for supervisors/admins)
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const isSupervisor = session?.user?.role === UserRole.SUPERVISOR || session?.user?.role === UserRole.ADMIN;

  const fetchTodayTeamAttendance = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/today-team");
      const result = await response.json();
      if (result.success) {
        setTeamAttendance(result.data.team || []);
      }
    } catch (error) {
      console.error("Error fetching today team attendance:", error);
    }
  }, []);

  // Remove auto-open modal - now showing cards by default

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?role=TECHNICIAN&role=SUPERVISOR");
      const result = await response.json();
      if (result.success) {
        // API returns { success: true, data: { users: [...], pagination: {...} } }
        const usersArray = result.data?.users || (Array.isArray(result.data) ? result.data : []);
        setUsers(usersArray);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Set empty array on error
    }
  }, []);

  const fetchLatestMonth = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedUserId && isSupervisor) {
        params.append("userId", selectedUserId);
      }
      
      // If month/year are set, use them; otherwise fetch latest month
      if (currentMonth && currentYear) {
        params.append("month", currentMonth.toString());
        params.append("year", currentYear.toString());
      }

      const response = await fetch(`/api/attendance/latest-month?${params}`);
      const result = await response.json();

      if (result.success) {
        setAttendances(result.data.attendances || []);
        if (result.data.monthStart) {
          setMonthStart(new Date(result.data.monthStart));
          const endDate = new Date(result.data.monthEnd);
          setMonthEnd(endDate);
          
          // Update current month/year to match fetched data
          setCurrentMonth(endDate.getMonth() + 1);
          setCurrentYear(endDate.getFullYear());
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load attendance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, selectedUserId, isSupervisor, toast]);

  useEffect(() => {
    if (isSupervisor) {
      fetchUsers();
      fetchTodayTeamAttendance();
    } else {
      // For technicians, fetch their own attendance
      fetchTodayTeamAttendance();
    }
    fetchLatestMonth();
  }, [fetchUsers, fetchTodayTeamAttendance, fetchLatestMonth, isSupervisor]);

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (attendance: any) => {
    setSelectedAttendance(attendance);
    setIsModalOpen(true);
  };

  // Ensure users is an array before filtering
  const filteredUsers = Array.isArray(users) 
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Calculate summary stats
  const summary = attendances.reduce(
    (acc, att) => {
      acc.totalDays += 1;
      if (att.checkOutTime) acc.completedDays += 1;
      if (att.checkInTime && att.checkOutTime) {
        const hours = (new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime()) / (1000 * 60 * 60);
        acc.totalHours += hours;
        if (hours > 8) acc.overtimeHours += hours - 8;
      }
      acc.totalTasks += att.attendanceTasks?.length || 0;
      acc.completedTasks += att.attendanceTasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
      return acc;
    },
    {
      totalDays: 0,
      completedDays: 0,
      totalHours: 0,
      overtimeHours: 0,
      totalTasks: 0,
      completedTasks: 0,
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance History</h1>
          <p className="text-muted-foreground">
            {monthStart && monthEnd
              ? `${monthNames[currentMonth - 1]} ${currentYear} - ${attendances.length} days with attendance`
              : "View attendance records and statistics"}
          </p>
        </div>
        {isSupervisor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Use first day of current month for export
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
                const url = `/api/attendance/export?date=${dateStr}&period=month${selectedUserId ? `&userId=${selectedUserId}` : ""}`;
                window.open(url, "_blank");
              }}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Monthly Report
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Select
                  value={currentMonth.toString()}
                  onValueChange={(value) => setCurrentMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-[100px]"
                  min={2020}
                  max={2100}
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* User Filter (for supervisors/admins) */}
            {isSupervisor && (
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <Select
                  value={selectedUserId || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedUserId("");
                      setSearchTerm("");
                    } else {
                      setSelectedUserId(value);
                      const user = Array.isArray(users) ? users.find((u) => u.id?.toString() === value) : null;
                      setSearchTerm(user?.name || "");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {Array.isArray(users) ? users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name} ({u.email})
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                <Package className="h-4 w-4 mr-2" />
                Cards
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary.totalDays > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Days Attended</CardDescription>
                <CardTitle className="text-2xl font-bold">{summary.totalDays}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Completed Days</CardDescription>
                <CardTitle className="text-2xl font-bold text-green-600">{summary.completedDays}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Hours</CardDescription>
                <CardTitle className="text-2xl font-bold">{summary.totalHours.toFixed(2)}h</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Overtime</CardDescription>
                <CardTitle className="text-2xl font-bold text-orange-600">{summary.overtimeHours.toFixed(2)}h</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Tasks</CardDescription>
                <CardTitle className="text-2xl font-bold">{summary.totalTasks}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Completed Tasks</CardDescription>
                <CardTitle className="text-2xl font-bold text-green-600">{summary.completedTasks}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </>
      )}

      {/* Content: Cards or Calendar */}
      {viewMode === "cards" ? (
        /* Cards View - Team Members Today */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Team Attendance Today</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(defaultSelectedDate)} - {teamAttendance.filter((e) => e.isPresent).length} present, {teamAttendance.filter((e) => !e.isPresent).length} absent
              </p>
            </div>
            <Badge variant="outline">{teamAttendance.length} Team Members</Badge>
          </div>
          
          {teamAttendance.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamAttendance.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onClick={() => {
                    setSelectedEmployeeId(employee.id);
                    setIsEmployeeModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No team members found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Calendar View */
        <MonthCalendar
          year={currentYear}
          month={currentMonth}
          userId={selectedUserId || undefined}
          onDayClick={(attendance, day) => {
            // Build date string from current month/year and day
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day || 1).padStart(2, '0')}`;
            
            // If supervisor/admin, show all attendances for that date
            if (isSupervisor) {
              setSelectedDate(dateStr);
              setIsDateModalOpen(true);
            } else {
              // For technicians, show single attendance modal if attendance exists
              if (attendance && attendance.id) {
                handleDayClick(attendance);
              }
            }
          }}
        />
      )}

      {/* Attendance Detail Modal (for single attendance) */}
      {selectedAttendance && (
        <AttendanceDetailModal
          attendanceId={selectedAttendance.id}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAttendance(null);
          }}
        />
      )}

      {/* Date Detail Modal (for all attendances on a date - supervisors/admins) */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          isOpen={isDateModalOpen}
          onClose={() => {
            setIsDateModalOpen(false);
            setSelectedDate(null);
          }}
        />
      )}

      {/* Employee Detail Modal (for individual employee attendance) */}
      {selectedEmployeeId && (
        <EmployeeDetailModal
          employeeId={selectedEmployeeId}
          date={defaultSelectedDate}
          isOpen={isEmployeeModalOpen}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setSelectedEmployeeId(null);
          }}
        />
      )}
    </div>
  );
}
