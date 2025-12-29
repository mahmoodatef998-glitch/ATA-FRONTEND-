import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { authorize, authorizeAny } from "@/lib/rbac/authorize";
import { UserRole, Prisma, TaskStatus } from "@prisma/client";
import { handleApiError, ValidationError, ForbiddenError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { revalidateTasks } from "@/lib/revalidate";
import { getCached } from "@/lib/cache";

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get list of tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by task status (can be multiple: status=PENDING&status=IN_PROGRESS)
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 */
// GET - List tasks
export async function GET(request: NextRequest) {
  try {
    // Check permission using RBAC
    const { userId, companyId } = await authorizeAny([
      PermissionAction.TASK_READ,
      PermissionAction.TASKS_READ_OWN,
      PermissionAction.TASKS_READ_ALL,
    ]);
    
    // Get session for user info
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    // Support multiple status values (e.g., status=PENDING&status=IN_PROGRESS)
    const statusParams = searchParams.getAll("status");
    const assignedToId = searchParams.get("assignedToId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.debug("Tasks API query", {
        statusParams,
        searchParams: Object.fromEntries(searchParams.entries()),
        userRole: session.user.role,
        companyId: session.user.companyId,
        context: "tasks"
      });
    }

    // Build where clause step by step
    const where: Prisma.tasksWhereInput = {
      companyId: companyId,
    };

    // Handle status filter first - support single or multiple values
    if (statusParams.length > 0) {
      // Validate status values
      const validStatuses: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
      const invalidStatuses = statusParams.filter((s) => !validStatuses.includes(s as TaskStatus));
      
      if (invalidStatuses.length > 0) {
        throw new ValidationError(
          `Invalid status values: ${invalidStatuses.join(", ")}`,
          invalidStatuses.map((s) => ({ field: "status", message: `Invalid status: ${s}` }))
        );
      }

      if (statusParams.length === 1) {
        where.status = statusParams[0] as TaskStatus;
      } else {
        // Multiple statuses - use 'in' operator
        where.status = {
          in: statusParams as TaskStatus[],
        };
      }
    }

    // Check user permissions to determine if they can read all tasks or only own
    const userPermissions = await import("@/lib/rbac/permission-service").then(m => 
      m.getUserPermissions(userId, companyId)
    );
    const canReadAll = userPermissions.includes(PermissionAction.TASK_READ) || 
                       userPermissions.includes(PermissionAction.TASKS_READ_ALL);
    const canReadOwn = userPermissions.includes(PermissionAction.TASKS_READ_OWN);
    
    // If user can only read own tasks, filter to their tasks
    if (canReadOwn && !canReadAll) {
      where.OR = [
        { assignedToId: userId },
        { assignees: { some: { userId } } },
      ];
    }
    
    // If user can read all, allow filtering by assignedToId
    if (canReadAll && assignedToId) {
      where.assignedToId = parseInt(assignedToId);
    }

    if (process.env.NODE_ENV === "development") {
      logger.debug("Tasks API where clause", { where, context: "tasks" });
    }

    // Create cache key based on user, company, and filters
    // Include all relevant filters to ensure cache accuracy
    const cacheKey = `tasks:${userId}:${companyId}:${JSON.stringify({
      status: statusParams,
      assignedToId,
      page,
      limit,
      canReadAll,
    })}`;

    // Use cached data if available (1 minute cache for task lists)
    const result = await getCached(
      cacheKey,
      async () => {
        const [tasks, total] = await Promise.all([
      prisma.tasks.findMany({
        where,
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
          _count: {
            select: {
              workLogs: true,
              supervisorReviews: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.tasks.count({ where }),
    ]);

    // Calculate stats for all tasks (not just current page)
    // Build stats where clause (same as main query but without status filter)
    const statsWhere: Prisma.tasksWhereInput = {
      companyId: session.user.companyId,
    };

    // Apply same filters as main query based on permissions
    if (canReadOwn && !canReadAll) {
      statsWhere.OR = [
        { assignedToId: userId },
        { assignees: { some: { userId } } },
      ];
    }

    // Apply assignedToId filter if provided (for supervisors/admins)
    if ((session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.ADMIN) && assignedToId) {
      statsWhere.assignedToId = parseInt(assignedToId);
    }

    const totalStats = await prisma.tasks.groupBy({
      by: ["status"],
      where: statsWhere,
      _count: {
        status: true,
      },
    });

        // Build stats object
        const stats = {
          total,
          pending: totalStats.find((s) => s.status === "PENDING")?._count.status || 0,
          inProgress: totalStats.find((s) => s.status === "IN_PROGRESS")?._count.status || 0,
          completed: totalStats.find((s) => s.status === "COMPLETED")?._count.status || 0,
          cancelled: totalStats.find((s) => s.status === "CANCELLED")?._count.status || 0,
        };

        return {
          success: true,
          data: {
            tasks,
            stats,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      },
      60 // 1 minute cache TTL for task lists
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create task
export async function POST(request: NextRequest) {
  try {
    // Check permission using RBAC
    const { userId, companyId } = await authorize(PermissionAction.TASK_CREATE);
    
    // Get session for user info
    const session = await requireAuth();

    const body = await request.json();
    const {
      title,
      description,
      assignedToId, // Legacy - for backward compatibility
      assigneeIds, // New - array of user IDs
      priority = "MEDIUM",
      deadline,
      location,
      locationLat,
      locationLng,
      estimatedHours,
    } = body;

    if (!title) {
      throw new ValidationError("Title is required", [
        { field: "title", message: "Title is required" },
      ]);
    }

    // userId already defined from authorize() above
    // Determine assignees: use assigneeIds if provided, otherwise use assignedToId (legacy)
    const assigneeIdsArray: number[] = [];
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      assigneeIdsArray.push(...assigneeIds.map((id: string | number) => parseInt(String(id))));
    } else if (assignedToId) {
      assigneeIdsArray.push(parseInt(assignedToId));
    }

    const task = await prisma.tasks.create({
      data: {
        companyId: session.user.companyId,
        title,
        description,
        assignedToId: assigneeIdsArray.length > 0 ? assigneeIdsArray[0] : null, // Legacy - first assignee
        assignedById: userId,
        priority: priority,
        deadline: deadline ? new Date(deadline) : null,
        location,
        locationLat,
        locationLng,
        estimatedHours,
        assignees: {
          create: assigneeIdsArray.map((assigneeId) => ({
            userId: assigneeId,
            assignedById: userId,
          })),
        },
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
      },
    });

    // Create notifications for all assigned users
    for (const assigneeId of assigneeIdsArray) {
      await prisma.notifications.create({
        data: {
          companyId: session.user.companyId,
          userId: assigneeId,
          title: `New Task Assigned: ${title}`,
          body: description || "You have been assigned a new task",
          meta: {
            taskId: task.id,
            type: "task_assigned",
          },
        },
      });

      // Emit Socket.io event
      if (global.io) {
        global.io.to(`user_${assigneeId}`).emit("new_notification", {
          title: `New Task Assigned: ${title}`,
          body: description || "You have been assigned a new task",
          taskId: task.id,
        });
      }
    }

    // Revalidate pages that display tasks
    await revalidateTasks();

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task created successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

