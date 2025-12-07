"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, MapPin, User, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AttendanceRequest {
  id: number;
  checkInTime: string;
  checkInLocation: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  status: string;
  users: {
    id: number;
    name: string;
    email: string;
  };
  meta: {
    reason: string;
    distance: number;
  };
}

export default function ApprovalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // Check if user is Admin
    if (session?.user && session.user.role !== UserRole.ADMIN) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      router.push("/team");
      return;
    }

    if (session?.user?.role === UserRole.ADMIN) {
      fetchPendingRequests();
    }
  }, [session, router, toast]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/attendance/pending");
      const data = await response.json();

      if (data.success) {
        setAttendanceRequests(data.data.attendance || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch pending requests",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pending requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: AttendanceRequest) => {
    try {
      setApproving(request.id);
      const response = await fetch(`/api/attendance/${request.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Attendance request approved successfully",
        });
        fetchPendingRequests();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = (request: AttendanceRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setDialogOpen(true);
    setIsApproving(false);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;

    try {
      setApproving(selectedRequest.id);
      const response = await fetch(`/api/attendance/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approved: false,
          rejectionReason: rejectionReason || "Rejected by admin",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Attendance request rejected",
        });
        setDialogOpen(false);
        setSelectedRequest(null);
        setRejectionReason("");
        fetchPendingRequests();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Attendance Approval
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and approve check-in requests from team members
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {attendanceRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                All attendance requests have been processed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attendanceRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{request.users.name}</CardTitle>
                      <CardDescription>{request.users.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Check-in Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.checkInTime), "PPp")}
                      </p>
                    </div>
                  </div>
                  {request.checkInLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{request.checkInLocation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {request.meta.reason && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Reason:</strong> {request.meta.reason}
                      {request.meta.distance > 0 && (
                        <span className="block mt-1">
                          <strong>Distance:</strong> {request.meta.distance}m from office
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(request)}
                    disabled={approving === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {approving === request.id ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(request)}
                    disabled={approving === request.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Attendance Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this check-in request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={approving !== null}
            >
              {approving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

