"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Package, User, Users, Database, LayoutDashboard, Calendar, FileText, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ModuleSwitcher } from "@/components/navigation/module-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSocket, useSocketEvent } from "@/hooks/use-socket";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
    companyId?: number;
    id?: number;
  };
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Initialize WebSocket connection
  const { socket, isConnected } = useSocket({
    companyId: user.companyId,
    userId: user.id,
    autoConnect: true,
  });

  // Real-time notification handler
  const handleNewNotification = useCallback((data: any) => {
    console.log("🔔 New notification received:", data);
    
    // Refresh unread count
    fetchUnreadCount();
    
    // Show toast notification
    toast({
      title: data.title || "New Notification",
      description: data.body || "You have a new notification",
    });
  }, [toast]);

  // Real-time order update handler
  const handleOrderUpdate = useCallback((data: any) => {
    console.log("📦 Order updated:", data);
    // Refresh unread count (in case there's a new notification)
    fetchUnreadCount();
  }, []);

  // Subscribe to real-time events
  useSocketEvent(socket, "new_notification", handleNewNotification);
  useSocketEvent(socket, "order_updated", handleOrderUpdate);

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.count || 0);
      } else {
        // Silently ignore errors (notifications are not critical)
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently ignore - notifications are not critical for app functionality
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleBackup = async () => {
    if (!confirm("Create database backup now?")) {
      return;
    }

    setIsBackingUp(true);
    toast({
      title: "🔄 Creating backup...",
      description: "Please wait...",
    });

    try {
      const response = await fetch("/api/backup", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Backup created successfully!",
          description: `File: ${result.data.fileName}`,
          className: "bg-green-50 border-green-200",
        });
      } else {
        toast({
          title: "❌ Backup failed",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Backup error:", error);
      toast({
        title: "❌ Connection error",
        description: "Could not create backup. Please make sure Docker is running.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <nav className="border-b bg-background" suppressHydrationWarning>
      <div className="w-full px-4 h-16 flex items-center justify-between overflow-hidden" suppressHydrationWarning>
        <div className="flex items-center gap-6 min-w-0 flex-1" suppressHydrationWarning>
          <Link href="/dashboard/orders" className="text-xl font-bold text-primary whitespace-nowrap flex-shrink-0">
            ATA CRM
          </Link>

          <div className="hidden lg:flex items-center gap-3 flex-1 min-w-0 overflow-x-auto scrollbar-hide" suppressHydrationWarning>
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                suppressHydrationWarning
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href="/dashboard/orders">
              <Button
                variant={pathname.startsWith("/dashboard/orders") ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
              >
                <Package className="mr-2 h-4 w-4" />
                Orders
              </Button>
            </Link>
            
            <Link href="/dashboard/notifications">
              <Button
                variant={pathname === "/dashboard/notifications" ? "default" : "ghost"}
                size="sm"
                className="relative whitespace-nowrap flex-shrink-0"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 px-1.5 py-0.5 text-xs absolute -top-1 -right-1"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/dashboard/calendar">
              <Button
                variant={pathname === "/dashboard/calendar" ? "default" : "ghost"}
                size="sm"
                className="relative whitespace-nowrap flex-shrink-0"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </Link>

            {/* Clients - Admin Only */}
            {user.role === "ADMIN" && (
              <Link href="/dashboard/clients">
                <Button
                  variant={pathname === "/dashboard/clients" ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  <User className="mr-2 h-4 w-4" />
                  Clients
                </Button>
              </Link>
            )}

            {/* Our Team Dashboard - Only for Technicians and Supervisors */}
            {(user.role === "TECHNICIAN" || user.role === "SUPERVISOR") && (
              <Link href="/team">
                <Button
                  variant={pathname.startsWith("/team") ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Our Team
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile/Tablet Menu */}
          <div className="lg:hidden flex items-center gap-1" suppressHydrationWarning>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/orders">
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Link>
                </DropdownMenuItem>
                {/* Clients - Admin Only */}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/clients">
                      <User className="mr-2 h-4 w-4" />
                      Clients
                    </Link>
                  </DropdownMenuItem>
                )}
                {(user.role === "TECHNICIAN" || user.role === "SUPERVISOR") && (
                  <DropdownMenuItem asChild>
                    <Link href="/team">
                      <Users className="mr-2 h-4 w-4" />
                      Our Team
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0" suppressHydrationWarning>
          {/* Module Switcher - Only for Admin, Operations Manager, Accountant, Supervisor */}
          <ModuleSwitcher currentModule="crm" />
          {/* Language Toggle */}
          <LanguageToggle />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Backup Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackup}
            disabled={isBackingUp}
            title="Database Backup"
            className="relative"
          >
            <Database className={`h-5 w-5 ${isBackingUp ? 'animate-pulse' : ''}`} />
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" suppressHydrationWarning>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground" suppressHydrationWarning>
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:flex flex-col items-start" suppressHydrationWarning>
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBackup} disabled={isBackingUp}>
                <Database className="mr-2 h-4 w-4" />
                {isBackingUp ? "Creating Backup..." : "Database Backup"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

