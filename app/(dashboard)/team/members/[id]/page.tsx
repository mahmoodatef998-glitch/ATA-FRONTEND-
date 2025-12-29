"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, Clock, Calendar, Loader2, MapPin, CheckCircle, XCircle, Mail, Briefcase, TrendingUp, CalendarDays, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import Image from "next/image";
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { RoleAssignmentGuard } from "@/lib/permissions/components";
import { logger } from "@/lib/logger-client";

interface AttendanceRecord {
  id: number;
  checkInTime: string;
  checkOutTime: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  status: string;
  attendanceType: string;
  hoursWorked: number | null;
  overtime: number;
}

interface MemberDetails {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    profilePicture: string | null;
    department: string | null;
    specialization: string | null;
    createdAt: string;
    companies: {
      id: number;
      name: string;
    };
  };
  stats: {
    daysWorked: number;
    totalHours: number;
    overtimeHours: number;
    isCheckedIn: boolean;
    checkInTime: string | null;
    checkInLocation: string | null;
    tasks: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    };
  };
  attendance: AttendanceRecord[];
  attendanceByMonth: Record<string, AttendanceRecord[]>;
  monthlyTotals: Record<string, {
    totalHours: number;
    totalOvertime: number;
    daysWorked: number;
  }>;
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ACCOUNTANT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  OPERATIONS_MANAGER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FACTORY_SUPERVISOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  SALES_REP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CLIENT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  TECHNICIAN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  SUPERVISOR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  HR: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  HR: "HR",
  OPERATIONS_MANAGER: "Operations Manager",
  FACTORY_SUPERVISOR: "Factory Supervisor",
  SALES_REP: "Sales Rep",
  CLIENT: "Client",
  TECHNICIAN: "Technician",
  SUPERVISOR: "Supervisor",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function TeamMemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Edit states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAttendanceOpen, setIsEditAttendanceOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Profile edit form
  const [profileForm, setProfileForm] = useState<{
    name: string;
    email: string;
    department: string;
    specialization: string;
    role: UserRole;
  }>({
    name: "",
    email: "",
    department: "",
    specialization: "",
    role: UserRole.TECHNICIAN,
  });

  // Attendance edit form
  const [attendanceForm, setAttendanceForm] = useState({
    checkInTime: "",
    checkOutTime: "",
    checkInLocation: "",
    checkOutLocation: "",
  });

  // Permission checks using RBAC
  const canEditProfile = usePermission(PermissionAction.USER_UPDATE);
  const canEditAttendance = usePermission(PermissionAction.ATTENDANCE_MANAGE);

  useEffect(() => {
    if (params.id) {
      fetchMemberDetails();
    }
  }, [params.id]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team/members/${params.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error("[Frontend] API Error", { status: response.status, errorText }, "team-members");
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setMember(result.data);
        // Initialize profile form
        setProfileForm({
          name: result.data.user.name,
          email: result.data.user.email,
          department: result.data.user.department || "",
          specialization: result.data.user.specialization || "",
          role: result.data.user.role,
        });
      } else {
        logger.error("[Frontend] API returned error", { error: result.error }, "team-members");
        toast({
          title: "Error",
          description: result.error || "Failed to load member details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logger.error("[Frontend] Error fetching member details", error, "team-members");
      toast({
        title: "Error",
        description: error.message || "An error occurred while loading member details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/team/members/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditProfileOpen(false);
        fetchMemberDetails(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logger.error("Error updating profile", error, "team-members");
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setEditingAttendance(record);
    const checkInDate = new Date(record.checkInTime);
    const checkOutDate = record.checkOutTime ? new Date(record.checkOutTime) : null;
    
    setAttendanceForm({
      checkInTime: checkInDate.toISOString().slice(0, 16), // Format for datetime-local
      checkOutTime: checkOutDate ? checkOutDate.toISOString().slice(0, 16) : "",
      checkInLocation: record.checkInLocation || "",
      checkOutLocation: record.checkOutLocation || "",
    });
    setIsEditAttendanceOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!editingAttendance) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/attendance/${editingAttendance.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkInTime: attendanceForm.checkInTime,
          checkOutTime: attendanceForm.checkOutTime || null,
          checkInLocation: attendanceForm.checkInLocation || null,
          checkOutLocation: attendanceForm.checkOutLocation || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Attendance record updated successfully",
        });
        setIsEditAttendanceOpen(false);
        setEditingAttendance(null);
        fetchMemberDetails(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update attendance",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logger.error("Error updating attendance", error, "team-members");
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDayFromDate = (dateString: string): number => {
    return new Date(dateString).getDate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Member not found</p>
        <Button onClick={() => router.push("/team/members")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team Members
        </Button>
      </div>
    );
  }

  const sortedMonths = Object.keys(member.attendanceByMonth || {}).sort((a, b) => {
    return b.localeCompare(a); // Newest first
  });

  const getMonthDays = (monthKey: string): AttendanceRecord[] => {
    if (!member.attendanceByMonth || !member.attendanceByMonth[monthKey]) {
      return [];
    }
    return member.attendanceByMonth[monthKey];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/team/members")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={roleColors[member.user.role]}>
            {roleLabels[member.user.role]}
          </Badge>
          {canEditProfile && (
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update the member&apos;s personal information and details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="name" className="sm:text-right">Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="sm:col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="email" className="sm:text-right">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="sm:col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="department" className="sm:text-right">Department</Label>
                    <Input
                      id="department"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="sm:col-span-3"
                      placeholder="e.g., IT, Operations, Sales"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="specialization" className="sm:text-right">Specialization</Label>
                    <Input
                      id="specialization"
                      value={profileForm.specialization}
                      onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      className="sm:col-span-3"
                      placeholder="e.g., Senior Technician, Field Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                    <Label htmlFor="role" className="sm:text-right">Role</Label>
                    <Select
                      value={profileForm.role}
                      onValueChange={(value) => setProfileForm({ ...profileForm, role: value as UserRole })}
                    >
                      <SelectTrigger className="sm:col-span-3">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.TECHNICIAN}>Technician</SelectItem>
                        <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
                        <RoleAssignmentGuard targetRole={UserRole.HR}>
                          <SelectItem value={UserRole.HR}>HR</SelectItem>
                        </RoleAssignmentGuard>
                        <RoleAssignmentGuard targetRole={UserRole.OPERATIONS_MANAGER}>
                          <SelectItem value={UserRole.OPERATIONS_MANAGER}>Operations Manager</SelectItem>
                        </RoleAssignmentGuard>
                        <RoleAssignmentGuard targetRole={UserRole.ACCOUNTANT}>
                          <SelectItem value={UserRole.ACCOUNTANT}>Accountant</SelectItem>
                        </RoleAssignmentGuard>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture */}
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {member.user.profilePicture ? (
                <Image
                  src={member.user.profilePicture}
                  alt={member.user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold">{member.user.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{member.user.email}</span>
                </div>
                {member.user.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{member.user.department}</span>
                  </div>
                )}
                {member.user.specialization && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{member.user.specialization}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Status */}
            <div className="flex flex-col items-end gap-2">
              {member.stats.isCheckedIn ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Checked In
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Checked In
                </Badge>
              )}
              {member.stats.checkInTime && (
                <p className="text-xs text-muted-foreground">
                  Since {formatTime(member.stats.checkInTime)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Working Days (This Month)</CardDescription>
            <CardTitle className="text-2xl font-bold">{member.stats.daysWorked}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Hours (This Month)</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{member.stats.totalHours}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overtime Hours (This Month)</CardDescription>
            <CardTitle className="text-2xl font-bold text-orange-600">{member.stats.overtimeHours}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold">{member.stats.tasks.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium text-yellow-600">{member.stats.tasks.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Progress:</span>
                <span className="font-medium text-blue-600">{member.stats.tasks.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium text-green-600">{member.stats.tasks.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      {sortedMonths.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Calendar
            </CardTitle>
            <CardDescription>Click on a month to view daily attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedMonths.map((monthKey) => {
                const total = member.monthlyTotals[monthKey];
                const isSelected = selectedMonth === monthKey;
                
                return (
                  <button
                    key={monthKey}
                    onClick={() => setSelectedMonth(isSelected ? null : monthKey)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="font-semibold text-lg mb-2">{formatMonthKey(monthKey)}</div>
                    {total && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Days:</span>
                          <span className="font-medium text-foreground">{total.daysWorked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hours:</span>
                          <span className="font-medium text-foreground">{total.totalHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overtime:</span>
                          <span className="font-medium text-orange-600">{total.totalOvertime}h</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No attendance records yet</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Month Details */}
      {selectedMonth && getMonthDays(selectedMonth).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {formatMonthKey(selectedMonth)} - Daily Details
                </CardTitle>
                <CardDescription>Daily attendance breakdown for this month</CardDescription>
              </div>
              {member.monthlyTotals[selectedMonth] && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Monthly Total</div>
                  <div className="text-2xl font-bold">
                    {member.monthlyTotals[selectedMonth].totalHours}h
                  </div>
                  <div className="text-sm text-orange-600">
                    +{member.monthlyTotals[selectedMonth].totalOvertime}h OT
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getMonthDays(selectedMonth)
                .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
                .map((record) => {
                  const day = getDayFromDate(record.checkInTime);
                  const checkInTime = formatTime(record.checkInTime);
                  const checkOutTime = record.checkOutTime ? formatTime(record.checkOutTime) : null;
                  
                  return (
                    <div
                      key={record.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {day}
                            </div>
                            <div>
                              <div className="font-semibold">Day {day}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(record.checkInTime).toLocaleDateString("en-US", {
                                  weekday: "long",
                                })}
                              </div>
                            </div>
                            {canEditAttendance && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAttendance(record)}
                                className="ml-auto"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 mt-3">
                            {/* Check-in */}
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="text-xs text-muted-foreground">Check-in</div>
                                <div className="font-medium text-green-700 dark:text-green-400">
                                  {checkInTime}
                                </div>
                                {record.checkInLocation && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 inline" /> {record.checkInLocation}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Check-out */}
                            {checkOutTime ? (
                              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Check-out</div>
                                  <div className="font-medium text-red-700 dark:text-red-400">
                                    {checkOutTime}
                                  </div>
                                  {record.checkOutLocation && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3 inline" /> {record.checkOutLocation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Status</div>
                                  <div className="font-medium text-yellow-700 dark:text-yellow-400">
                                    Still Working
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Hours & Overtime */}
                          {record.hoursWorked !== null && (
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                  <span className="font-medium">{record.hoursWorked}h</span> worked
                                </span>
                              </div>
                              {record.overtime > 0 && (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm text-orange-600">
                                    <span className="font-medium">{record.overtime}h</span> overtime
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={
                            record.status === "APPROVED"
                              ? "bg-green-50 text-green-800 border-green-200"
                              : record.status === "PENDING"
                              ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Attendance Dialog */}
      {canEditAttendance && (
        <Dialog open={isEditAttendanceOpen} onOpenChange={setIsEditAttendanceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Attendance Record</DialogTitle>
              <DialogDescription>
                Update the check-in and check-out times and locations for this attendance record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="checkInTime" className="sm:text-right">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={attendanceForm.checkInTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="checkOutTime" className="sm:text-right">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="datetime-local"
                  value={attendanceForm.checkOutTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="checkInLocation" className="sm:text-right">Check-in Location</Label>
                <Input
                  id="checkInLocation"
                  value={attendanceForm.checkInLocation}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInLocation: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="e.g., Office, Client Site"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="checkOutLocation" className="sm:text-right">Check-out Location</Label>
                <Input
                  id="checkOutLocation"
                  value={attendanceForm.checkOutLocation}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutLocation: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="e.g., Office, Client Site"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditAttendanceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
