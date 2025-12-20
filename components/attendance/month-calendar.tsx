"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface MonthCalendarProps {
  year: number;
  month: number;
  userId?: string;
  onDayClick: (attendance: any | null, day?: number) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({
  year,
  month,
  userId,
  onDayClick,
}: MonthCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [attendancesMap, setAttendancesMap] = useState<Map<string, any>>(new Map());

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/attendance/calendar?${params}`);
      const result = await response.json();

      if (result.success) {
        setCalendar(result.data.calendar || []);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  }, [month, userId, year]);

  const fetchAttendances = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });
      if (userId) params.append("userId", userId);

      const response = await fetch(`/api/attendance/latest-month?${params}`);
      const result = await response.json();

      if (result.success && result.data.attendances) {
        const map = new Map();
        result.data.attendances.forEach((att: any) => {
          const date = new Date(att.date);
          const day = date.getDate();
          map.set(day.toString(), att);
        });
        setAttendancesMap(map);
      }
    } catch (error) {
      console.error("Error fetching attendances:", error);
    }
  }, [month, userId, year]);

  useEffect(() => {
    fetchCalendar();
    fetchAttendances();
  }, [fetchCalendar, fetchAttendances]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {new Date(year, month - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Incomplete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Absent</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px]"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayKey = day.toString();
            const dayData = calendar.find((c) => c.day === day);
            const attendance = attendancesMap.get(dayKey);

            const hasAttendance = dayData?.hasAttendance || attendance !== undefined;
            const isComplete = dayData?.isComplete || (attendance?.checkOutTime !== null);

            return (
              <button
                key={day}
                onClick={() => {
                  // Always pass day number, and attendance if exists
                  if (attendance) {
                    onDayClick(attendance, day);
                  } else {
                    onDayClick(null, day);
                  }
                }}
                className={`
                  relative p-2 min-h-[100px] border rounded-lg text-left
                  transition-all hover:shadow-md cursor-pointer
                  ${hasAttendance && isComplete
                    ? "bg-green-50 border-green-300 hover:bg-green-100"
                    : hasAttendance && !isComplete
                    ? "bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }
                  ${!hasAttendance ? "opacity-50" : ""}
                `}
              >
                <div className="font-semibold mb-1">{day}</div>
                {hasAttendance && attendance && (
                  <div className="text-xs space-y-1">
                    {attendance.checkInTime && (
                      <div className="text-blue-600 font-medium">
                        {new Date(attendance.checkInTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    {attendance.attendanceTasks && attendance.attendanceTasks.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {attendance.attendanceTasks.length} task
                        {attendance.attendanceTasks.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

