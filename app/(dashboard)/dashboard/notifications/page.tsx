import { getBaseUrl } from "@/lib/utils";
import { cookies } from "next/headers";
import { NotificationsList } from "@/components/dashboard/notifications-list";

async function getNotifications() {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    
    if (!session || !session.user) {
      console.log("🔔 [Notifications Page] No session found");
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }

    const { prisma } = await import("@/lib/prisma");
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

    console.log("🔔 [Notifications Page] Fetching notifications for:", {
      userId,
      companyId,
    });

    // Build where clause - Get notifications for this user OR company-level notifications
    const where: any = {
      companyId: companyId,
      OR: [
        { userId: userId },
        { userId: null }, // Company-level notifications (for all users in company)
      ],
    };

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      }),
      prisma.notifications.count({ where }),
    ]);

    console.log("🔔 [Notifications Page] Found notifications:", {
      count: notifications.length,
      total,
    });

    return {
      notifications: notifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      })),
      pagination: {
        page: 1,
        limit: 20,
        total,
        totalPages: Math.ceil(total / 20),
      },
    };
  } catch (error) {
    console.error("🔔 [Notifications Page] Error fetching notifications:", error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

export default async function NotificationsPage() {
  const data = await getNotifications();

  return <NotificationsList initialNotifications={data.notifications} pagination={data.pagination} />;
}

