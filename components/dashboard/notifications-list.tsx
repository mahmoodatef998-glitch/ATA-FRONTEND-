"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  meta: any;
}

interface NotificationsListProps {
  initialNotifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function NotificationsList({ initialNotifications, pagination }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const markAsRead = async (notificationId: number) => {
    if (markingRead === notificationId) return;
    
    setMarkingRead(notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleViewOrder = async (notification: Notification, orderId: number) => {
    // Mark as read when viewing order
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Navigate to order page
    router.push(`/dashboard/orders/${orderId}`);
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, { 
            method: "PATCH",
            credentials: "include", // ✅ Critical: Include credentials for authentication
          })
        )
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Use startTransition for non-blocking UI updates
      startTransition(() => {
        router.refresh(); // Refresh to update unread count in navbar
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with order changes and updates
          </p>
        </div>
        {notifications.filter((n) => !n.read).length > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
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
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You&apos;re all caught up! New orders and updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(notification, notification.meta.orderId)}
                        >
                          View Order
                        </Button>
                      )}
                      {notification.meta?.actionType === "approve_client" && notification.meta?.clientId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            router.push("/dashboard/clients");
                          }}
                        >
                          Review Client
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingRead === notification.id}
                        >
                          {markingRead === notification.id ? "..." : "Mark Read"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} notifications
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
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

