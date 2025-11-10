import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { cookies } from "next/headers";

async function getNotifications() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("next-auth.session-token") || cookieStore.get("__Secure-next-auth.session-token");
    
    if (!sessionCookie) {
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }

    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3005"}/api/notifications?page=1&limit=20`, {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch notifications:", response.status);
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }

    const data = await response.json();
    return data.data || {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

export default async function NotificationsPage() {
  const data = await getNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with order changes and updates
          </p>
        </div>
        {data.pagination.total > 0 && (
          <Button variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Recent updates and activities</CardDescription>
        </CardHeader>
        <CardContent>
          {data.notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You&apos;re all caught up! New orders and updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50 border-blue-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{notification.title}</h4>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {notification.meta?.orderId && (
                        <Link href={`/dashboard/orders/${notification.meta.orderId}`}>
                          <Button variant="outline" size="sm">
                            View Order
                          </Button>
                        </Link>
                      )}
                      {!notification.read && (
                        <Button variant="ghost" size="sm">
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} notifications
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={data.pagination.page === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

