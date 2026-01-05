"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/ui/link";
import { Bell, CheckCheck, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ClientNavbar } from "@/components/client/client-navbar";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  meta: any;
}

export default function ClientNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientName, setClientName] = useState("");
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchClientInfo();
  }, []);

  const fetchClientInfo = async () => {
    try {
      const response = await fetch("/api/client/orders");
      if (response.ok) {
        const data = await response.json();
        if (data.data?.orders?.[0]?.clients) {
          setClientName(data.data.orders[0].clients.name);
        }
      }
    } catch (error) {
      console.error("Error fetching client info:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client/notifications");
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/client/login");
          return;
        }
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (markingRead === notificationId) return;
    
    setMarkingRead(notificationId);
    try {
      const response = await fetch(`/api/client/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
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
    // Navigate to order tracking
    router.push(`/order/track/${orderId}`);
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/client/notifications/${n.id}/read`, { method: "PATCH" })
        )
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar clientName={clientName} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your order changes and updates
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
              <CardDescription>Recent updates and activities on your orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    You&apos;re all caught up! New updates will appear here.
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
                              <Package className="mr-2 h-4 w-4" />
                              View Order
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

