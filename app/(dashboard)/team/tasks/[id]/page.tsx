"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, MapPin, User, Package, CheckCircle, Circle, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { WorkLogForm } from "@/components/technician/work-log-form";
import { useSession } from "next-auth/react";
import { useStableAsyncEffect } from "@/hooks/use-stable-effect";
import { UserRole } from "@prisma/client";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-300";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "LOW":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "IN_PROGRESS":
      return <Circle className="h-4 w-4 text-blue-600" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-300";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [showWorkLogForm, setShowWorkLogForm] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setTask(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load task",
          variant: "destructive",
        });
        router.push("/team/tasks");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task",
        variant: "destructive",
      });
      router.push("/team/tasks");
    } finally {
      setLoading(false);
    }
  }, [params.id, router, toast]);

  useStableAsyncEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id, fetchTask]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Status updated",
          description: "Task status has been updated",
          className: "bg-green-50 border-green-200",
        });
        fetchTask();
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Task not found</p>
            <Link href="/team/tasks">
              <Button variant="outline" className="mt-4">
                Back to Tasks
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "COMPLETED";
  // Only Operations Manager and Supervisor can mark tasks as finished
  const canMarkFinished = session?.user?.role === UserRole.OPERATIONS_MANAGER || 
                          session?.user?.role === UserRole.SUPERVISOR;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/team/tasks">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      {/* Task Header */}
      <Card className={isOverdue ? "border-red-300 bg-red-50/50" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  {task.status.replace("_", " ")}
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {task.deadline && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                  Deadline: {formatDateTime(task.deadline)}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}

            {task.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{task.location}</span>
              </div>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Assigned to: {task.assignedTo.name}
                </span>
              </div>
            )}

            {task.assignedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Assigned by: {task.assignedBy.name}
                </span>
              </div>
            )}

            {task.estimatedHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Estimated: {task.estimatedHours}h
                </span>
              </div>
            )}

            {task.actualHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Actual: {task.actualHours}h
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canMarkFinished && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && (
                <Button
                  onClick={() => handleStatusUpdate("IN_PROGRESS")}
                  variant="outline"
                >
                  Start Work
                </Button>
              )}
              {task.status === "IN_PROGRESS" && (
                <Button
                  onClick={() => handleStatusUpdate("COMPLETED")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Completed
                </Button>
              )}
              {task.status === "COMPLETED" && (
                <div className="text-sm text-muted-foreground">
                  This task has been marked as completed.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Work Log Form - Available for all assigned users */}
      {session?.user && (
        <Card>
          <CardHeader>
            <CardTitle>Work Log</CardTitle>
          </CardHeader>
          <CardContent>
            {!showWorkLogForm ? (
              <Button
                onClick={() => setShowWorkLogForm(true)}
                variant="outline"
              >
                Submit Work Log
              </Button>
            ) : (
              <WorkLogForm
                taskId={task.id}
                onSuccess={() => {
                  setShowWorkLogForm(false);
                  fetchTask();
                }}
              />
            )}
          </CardContent>
        </Card>
      )}


      {/* Work Logs */}
      {task.workLogs && task.workLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Work Logs ({task.workLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.workLogs.map((log: any) => (
                <Card key={log.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{log.users.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(log.startTime)}
                          {log.endTime && ` - ${formatDateTime(log.endTime)}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          log.status === "APPROVED"
                            ? "default"
                            : log.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">{log.description}</p>
                    {log.photos && Array.isArray(log.photos) && log.photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {log.photos.map((photo: string, idx: number) => (
                          <a
                            key={idx}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={photo}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {task.supervisorReviews && task.supervisorReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({task.supervisorReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.supervisorReviews.map((review: any) => (
                <Card key={review.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.supervisor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(review.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comments && (
                      <p className="text-sm">{review.comments}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

