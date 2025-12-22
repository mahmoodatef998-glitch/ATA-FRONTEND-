import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole, Prisma } from "@prisma/client";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";

// GET - List work logs
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { userId: authUserId, companyId } = await authorize(PermissionAction.TASK_READ);

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    const where: Prisma.work_logsWhereInput = {};

    // Technicians can only see their own work logs
    if (session.user.role === UserRole.TECHNICIAN) {
      const currentUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
      where.userId = currentUserId;
    } else if (userId) {
      where.userId = parseInt(userId);
    }

    if (taskId) {
      where.taskId = parseInt(taskId);
    }

    if (status) {
      where.status = status;
    }

    const [workLogs, total] = await Promise.all([
      prisma.work_logs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.work_logs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Get work logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get work logs" },
      { status: 500 }
    );
  }
}

// POST - Submit work log
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { userId, companyId } = await authorize(PermissionAction.TASK_COMMENT);

    // userId already defined from authorize() above

    const formData = await request.formData();
    const taskId = parseInt(formData.get("taskId") as string);
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string | null;
    const photos = formData.getAll("photos") as File[];

    if (!taskId || !description || !startTime) {
      return NextResponse.json(
        { success: false, error: "Task ID, description, and start time are required" },
        { status: 400 }
      );
    }

    // Verify task exists and is assigned to user (for technicians)
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        companyId: session.user.companyId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Technicians can only submit work logs for their own tasks
    if (session.user.role === UserRole.TECHNICIAN && task.assignedToId !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Upload photos
    const photoUrls: string[] = [];
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        if (photo.size > 0) {
          try {
            if (isCloudinaryConfigured()) {
              const result = await uploadFile(photo, "work-logs", {
                resource_type: "image",
              });
              photoUrls.push(result.secure_url);
            } else {
              // Fallback to local storage
              const bytes = await photo.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const timestamp = Date.now();
              const randomStr = Math.random().toString(36).substring(7);
              const ext = photo.name.split(".").pop() || "jpg";
              const filename = `worklog-${taskId}-${timestamp}-${randomStr}.${ext}`;
              
              // Save to public/uploads/work-logs
              const fs = await import("fs/promises");
              const path = await import("path");
              const uploadDir = path.join(process.cwd(), "public", "uploads", "work-logs");
              await fs.mkdir(uploadDir, { recursive: true });
              await fs.writeFile(path.join(uploadDir, filename), buffer);
              photoUrls.push(`/uploads/work-logs/${filename}`);
            }
          } catch (err) {
            console.error("Error uploading photo:", err);
          }
        }
      }
    }

    const workLog = await prisma.work_logs.create({
      data: {
        userId,
        taskId,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: "SUBMITTED",
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Notify supervisor if task has one
    if (task.assignedById) {
      await prisma.notifications.create({
        data: {
          companyId: session.user.companyId,
          userId: task.assignedById,
          title: `Work Log Submitted: ${task.title}`,
          body: `${session.user.name} submitted a work log`,
          meta: {
            taskId: task.id,
            workLogId: workLog.id,
            type: "work_log_submitted",
          },
        },
      });

      if (global.io) {
        global.io.to(`user_${task.assignedById}`).emit("new_notification", {
          title: `Work Log Submitted: ${task.title}`,
          body: `${session.user.name} submitted a work log`,
          taskId: task.id,
          workLogId: workLog.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: workLog,
      message: "Work log submitted successfully",
    });
  } catch (error: any) {
    console.error("Submit work log error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit work log" },
      { status: 500 }
    );
  }
}

