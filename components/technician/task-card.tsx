"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, AlertCircle, CheckCircle, Circle, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    deadline?: string;
    location?: string;
    assignedTo?: {
      id: number;
      name: string;
    };
    assignedBy?: {
      id: number;
      name: string;
    };
    _count?: {
      workLogs: number;
      supervisorReviews: number;
    };
  };
  showActions?: boolean;
}

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

export function TaskCard({ task, showActions = true }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "COMPLETED";

  return (
    <Card className={`hover:shadow-lg transition-all ${isOverdue ? "border-red-300 bg-red-50/50" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
            <CardDescription className="line-clamp-2">{task.description}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                Deadline: {formatDateTime(task.deadline)}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          )}

          {task.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{task.location}</span>
            </div>
          )}

          {task.assignedBy && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Assigned by: {task.assignedBy.name}
              </span>
            </div>
          )}

          {task._count && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
              <span>Work Logs: {task._count.workLogs}</span>
              <span>Reviews: {task._count.supervisorReviews}</span>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Link href={`/team/tasks/${task.id}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

