"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";

interface AttendanceRecord {
  id: number;
  checkInTime: string;
  checkInLat: number | null;
  checkInLng: number | null;
  checkInLocation: string | null;
  attendanceType: string;
  status: string;
  users: {
    id: number;
    name: string;
    email: string;
  };
  meta?: {
    reason?: string;
    distance?: number;
  };
}

export default function AttendanceApprovalPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchPendingAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/attendance/pending");
      const result = await response.json();

      if (result.success) {
        setAttendance(result.data.attendance);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load pending attendance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching pending attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load pending attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useStableAsyncEffect(() => {
    fetchPendingAttendance();
  }, [fetchPendingAttendance]);

  const handleApproval = async (attendanceId: number, approved: boolean, rejectionReason?: string) => {
    try {
      setProcessing(attendanceId);
      const response = await fetch(`/api/attendance/${attendanceId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved,
          rejectionReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: approved ? "Approved" : "Rejected",
          description: result.message,
        });
        // Remove from list
        setAttendance((prev) => prev.filter((a) => a.id !== attendanceId));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to process request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Approval</h1>
        <p className="text-muted-foreground">
          Review and approve attendance requests from outside the allowed radius.
        </p>
      </div>

      {attendance.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No pending requests</p>
            <p className="text-muted-foreground">All attendance requests have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {attendance.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {record.users.name}
                    </CardTitle>
                    <CardDescription>{record.users.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Check-in Time:</span>
                    <span>{formatDateTime(new Date(record.checkInTime))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{record.checkInLocation || "Unknown"}</span>
                  </div>
                  {record.checkInLat && record.checkInLng && (
                    <div className="flex items-center gap-2 text-sm md:col-span-2">
                      <span className="font-medium">Coordinates:</span>
                      <span className="text-muted-foreground">
                        {record.checkInLat.toFixed(6)}, {record.checkInLng.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${record.checkInLat},${record.checkInLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Type:</span>
                    <Badge variant="secondary">{record.attendanceType}</Badge>
                  </div>
                  {record.meta?.reason && (
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Reason for Request:</p>
                      <p className="text-sm text-blue-800">{record.meta.reason}</p>
                      {record.meta.distance && (
                        <p className="text-xs text-blue-700 mt-1">
                          Distance: {record.meta.distance}m from office
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApproval(record.id, true)}
                    disabled={processing === record.id}
                    className="flex-1"
                  >
                    {processing === record.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt("Enter rejection reason (optional):");
                      if (reason !== null) {
                        handleApproval(record.id, false, reason || undefined);
                      }
                    }}
                    disabled={processing === record.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === record.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

