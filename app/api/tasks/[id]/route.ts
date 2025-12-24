import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { authorize, authorizeAny } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";
import { handleApiError } from "@/lib/error-handler";
import { validateId } from "@/lib/utils/validation-helpers";
import { revalidateTasks } from "@/lib/revalidate";
import { logger } from "@/lib/logger";

// GET - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission using RBAC - allow reading own tasks or all tasks
    const { userId, companyId } = await authorizeAny([
      PermissionAction.TASK_READ,
      PermissionAction.TASKS_READ_ALL,
      PermissionAction.TASKS_READ_OWN,
    ]);
    
    // Get session for user info
    const session = await requireAuth();

    const { id } = await params;
    const taskId = validateId(id, "task");

    logger.debug("[Tasks API] Getting task", { taskId, companyId: session.user.companyId, userId: session.user.id, role: session.user.role }, "tasks");

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        companyId: companyId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workLogs: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        supervisorReviews: {
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Technicians can only view their own tasks (either assignedToId or in assignees)
    if (session.user.role === UserRole.TECHNICIAN) {
      const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
      const isAssigned = task.assignedToId === userId || (task.assignees && task.assignees.some((a) => a.userId === userId));
      if (!isAssigned) {
      logger.warn("[Tasks API] Access denied for technician", { userId, taskAssignedToId: task.assignedToId, taskAssignees: task.assignees }, "tasks");
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error("[Tasks API] Get task error", error, "tasks");
    return handleApiError(error);
  }
}

// PATCH - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission using RBAC - allow updating own tasks or all tasks
    const { userId: authUserId, companyId: authCompanyId } = await authorizeAny([
      PermissionAction.TASK_UPDATE,
      PermissionAction.TASKS_UPDATE_ALL,
      PermissionAction.TASKS_UPDATE_OWN,
    ]);
    
    // Get session for user info
    const session = await requireAuth();

    const { id } = await params;
    const taskId = parseInt(id);
    const body = await request.json();

    // Check if task exists and belongs to company
    const existingTask = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        companyId: companyId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Only Operations Manager and Supervisor can mark tasks as finished (COMPLETED)
    // Check if trying to update status to COMPLETED
    if (body.status === "COMPLETED") {
      if (session.user.role !== UserRole.OPERATIONS_MANAGER && session.user.role !== UserRole.SUPERVISOR) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Access denied. Only Operations Managers and Supervisors can mark tasks as finished." 
          },
          { status: 403 }
        );
      }
    }
    
    // Technicians cannot update task status at all
    if (session.user.role === UserRole.TECHNICIAN && body.status !== undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Access denied. Technicians cannot update task status." 
        },
        { status: 403 }
      );
    }
    
    // Only Operations Manager and Supervisor can start tasks (IN_PROGRESS)
    if (body.status === "IN_PROGRESS") {
      if (session.user.role !== UserRole.OPERATIONS_MANAGER && session.user.role !== UserRole.SUPERVISOR) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Access denied. Only Operations Managers and Supervisors can start tasks." 
          },
          { status: 403 }
        );
      }
    }
    
    let updateData: any = {};
    let assigneeIdsToUpdate: number[] | null = null;
    
    // Only Operations Manager, Supervisor, and Admin can update task fields
    if (session.user.role === UserRole.OPERATIONS_MANAGER || 
        session.user.role === UserRole.SUPERVISOR || 
        session.user.role === UserRole.ADMIN) {
      // Supervisors, Operations Managers, and Admins can update all fields
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId ? parseInt(body.assignedToId) : null;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.locationLat !== undefined) updateData.locationLat = body.locationLat;
      if (body.locationLng !== undefined) updateData.locationLng = body.locationLng;
      if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
      if (body.actualHours !== undefined) updateData.actualHours = body.actualHours;
      
      // Handle assigneeIds update
      if (body.assigneeIds !== undefined) {
        if (Array.isArray(body.assigneeIds)) {
          assigneeIdsToUpdate = body.assigneeIds.map((id: any) => parseInt(id));
        } else if (body.assigneeIds === null || body.assigneeIds === "") {
          assigneeIdsToUpdate = [];
        }
      }
    } else {
      // Other roles cannot update tasks
      return NextResponse.json(
        { 
          success: false, 
          error: "Access denied. Only Operations Managers, Supervisors, and Admins can update tasks." 
        },
        { status: 403 }
      );
    }

    updateData.updatedAt = new Date();

    // Use userId from authorize
    const userId = authUserId;

    // Get previous assignees before updating (for notifications)
    let previousAssigneeIds = new Set<number>();
    if (assigneeIdsToUpdate !== null) {
      const previousAssignees = await prisma.task_assignees.findMany({
        where: { taskId },
        select: { userId: true },
      });
      previousAssigneeIds = new Set(previousAssignees.map((a) => a.userId));
    }

    // Update assignees if needed
    if (assigneeIdsToUpdate !== null) {
      // Delete existing assignees
      await prisma.task_assignees.deleteMany({
        where: { taskId },
      });

      // Create new assignees
      if (assigneeIdsToUpdate.length > 0) {
        await prisma.task_assignees.createMany({
          data: assigneeIdsToUpdate.map((assigneeId) => ({
            taskId,
            userId: assigneeId,
            assignedById: userId,
          })),
        });
      }

      // Update assignedToId to first assignee (for backward compatibility)
      updateData.assignedToId = assigneeIdsToUpdate.length > 0 ? assigneeIdsToUpdate[0] : null;
    }

    const task = await prisma.tasks.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify newly assigned users
    if (assigneeIdsToUpdate !== null) {
      for (const assigneeId of assigneeIdsToUpdate) {
        if (!previousAssigneeIds.has(assigneeId)) {
          await prisma.notifications.create({
            data: {
              companyId: authCompanyId,
              userId: assigneeId,
              title: `Task Assigned: ${task.title}`,
              body: "You have been assigned a new task",
              meta: {
                taskId: task.id,
                type: "task_assigned",
              },
            },
          });

          if (global.io) {
            global.io.to(`user_${assigneeId}`).emit("new_notification", {
              title: `Task Assigned: ${task.title}`,
              body: "You have been assigned a new task",
              taskId: task.id,
            });
          }
        }
      }
    } else if (body.assignedToId && body.assignedToId !== existingTask.assignedToId) {
      // Legacy: Notify if assignedToId changed
      await prisma.notifications.create({
        data: {
          companyId: companyId,
          userId: parseInt(body.assignedToId),
          title: `Task Assigned: ${task.title}`,
          body: "You have been assigned a new task",
          meta: {
            taskId: task.id,
            type: "task_assigned",
          },
        },
      });

      if (global.io) {
        global.io.to(`user_${body.assignedToId}`).emit("new_notification", {
          title: `Task Assigned: ${task.title}`,
          body: "You have been assigned a new task",
          taskId: task.id,
        });
      }
    }

    // Revalidate pages that display tasks
    await revalidateTasks();

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task updated successfully",
    });
  } catch (error) {
    logger.error("[Tasks API] Update task error", error, "tasks");
    return handleApiError(error);
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId, companyId } = await authorize(PermissionAction.TASK_UPDATE);

    const { id } = await params;
    const taskId = parseInt(id);

    // userId already defined from authorize() above
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        companyId: companyId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Only supervisors and admins can delete tasks
    if (session.user.role !== UserRole.SUPERVISOR && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.tasks.delete({
      where: { id: taskId },
    });

    // Revalidate pages that display tasks
    await revalidateTasks();

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    logger.error("[Tasks API] Delete task error", error, "tasks");
    return handleApiError(error);
  }
}

