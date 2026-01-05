"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";

export default function NewTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const canCreateTask = usePermission(PermissionAction.TASK_CREATE);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (session && !canCreateTask) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create tasks. Only Admin, Operations Manager, and Supervisor can create tasks.",
        variant: "destructive",
      });
      router.push("/team/tasks");
    }
  }, [session, canCreateTask, router, toast]);
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "", // Legacy - for backward compatibility
    assigneeIds: [] as number[], // New - for multiple assignees
    priority: "MEDIUM",
    deadline: "",
    location: "",
    estimatedHours: "",
  });

  // Fetch team members (technicians + supervisors) if user has permission to create tasks
  useEffect(() => {
    if (canCreateTask) {
      Promise.all([
        fetch("/api/users?role=TECHNICIAN").then((res) => res.json()),
        fetch("/api/users?role=SUPERVISOR").then((res) => res.json()),
      ]).then(([techData, supervisorData]) => {
        // API returns { success: true, data: { users: [...], pagination: {...} } }
        const techMembers = techData?.success && techData?.data?.users 
          ? (Array.isArray(techData.data.users) ? techData.data.users : [])
          : [];
        const supervisorMembers = supervisorData?.success && supervisorData?.data?.users
          ? (Array.isArray(supervisorData.data.users) ? supervisorData.data.users : [])
          : [];
        
        const allMembers = [...techMembers, ...supervisorMembers];
        setTechnicians(allMembers);
      }).catch((error) => {
        console.error("Error fetching team members:", error);
        setTechnicians([]);
      });
    }
  }, [canCreateTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : (formData.assignedToId ? [parseInt(formData.assignedToId)] : []),
          assignedToId: formData.assignedToId || null, // Legacy - for backward compatibility
          deadline: formData.deadline || null,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Task created",
          description: "Task has been created successfully",
          className: "bg-green-50 border-green-200",
        });
        router.push("/team/tasks");
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to create task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "❌ Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user doesn't have permission
  if (!canCreateTask) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link href="/team/tasks">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>Assign a new task to a technician</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={4}
              />
            </div>

            {canCreateTask && (
              <div>
                <Label>Assign To (Multiple Selection)</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {technicians.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members available</p>
                  ) : (
                    technicians.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assignee-${member.id}`}
                          checked={formData.assigneeIds.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                assigneeIds: [...formData.assigneeIds, member.id],
                                assignedToId: formData.assigneeIds.length === 0 ? member.id.toString() : formData.assignedToId, // Legacy
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assigneeIds: formData.assigneeIds.filter((id) => id !== member.id),
                                assignedToId: formData.assigneeIds.length === 1 && formData.assigneeIds[0] === member.id ? "" : formData.assignedToId, // Legacy
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`assignee-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {member.name} ({member.email}) {member.role === "SUPERVISOR" && <span className="text-xs text-muted-foreground">- Supervisor</span>}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.assigneeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.assigneeIds.length} {formData.assigneeIds.length === 1 ? "person" : "people"} selected
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="e.g. 4"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
              <Link href="/team/tasks">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

