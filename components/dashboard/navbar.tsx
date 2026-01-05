"use client";

import { Link } from "@/components/ui/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Package, User, Users, Database, LayoutDashboard, Calendar, FileText, Clock, TrendingUp, CheckCircle, Menu, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ModuleSwitcher } from "@/components/navigation/module-switcher";
import { useI18n } from "@/lib/i18n/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSocket, useSocketEvent } from "@/hooks/use-socket";
import { usePolling } from "@/lib/hooks/use-polling";
import { deduplicateRequest } from "@/lib/utils/request-deduplication";

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
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // ✅ Performance: Disable RSC prefetching on hover - causes RSC storms
  // Client-side navigation is fast enough without prefetching
  // const handlePrefetch = useCallback((path: string) => {
  //   router.prefetch(path);
  // }, [router]);

  // Initialize WebSocket connection - non-blocking, will fail gracefully on Vercel
  // Socket.io is optional and should not delay page load
  const { socket, isConnected } = useSocket({
    companyId: user.companyId,
    userId: user.id,
    autoConnect: true, // Will auto-detect Vercel and skip connection
  });

  // ✅ Performance: Memoize fetchUnreadCount to prevent re-creation
  // ✅ FIX: Add request deduplication to prevent duplicate calls
  const fetchUnreadCount = useCallback(async () => {
    // ✅ Performance: Deduplicate requests within 1 second window
    const userId = user.id || 0;
    const deduplicationKey = `unread-count:${userId}`;
    
    return deduplicateRequest(
      deduplicationKey,
      async () => {
        try {
          // ✅ Fix: Add credentials and ensure session is ready
          const response = await fetch("/api/notifications/unread-count", {
            credentials: "include", // ✅ Critical: Include credentials for authentication
          });
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.data?.count || 0);
            return data;
          } else {
            // Silently ignore errors (notifications are not critical)
            setUnreadCount(0);
            return { success: true, data: { count: 0 } };
          }
        } catch (error) {
          // Silently ignore - notifications are not critical for app functionality
          setUnreadCount(0);
          return { success: true, data: { count: 0 } };
        }
      },
      1000 // ✅ Deduplication window: 1 second
    );
  }, [user.id]);

  // Real-time notification handler
  const handleNewNotification = useCallback((data: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔔 New notification received:", data);
    }
    
    // Refresh unread count
    fetchUnreadCount();
    
    // Show toast notification
    toast({
      title: data.title || "New Notification",
      description: data.body || "You have a new notification",
    });
  }, [toast, fetchUnreadCount]);

  // Real-time order update handler
  const handleOrderUpdate = useCallback((data: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("📦 Order updated:", data);
    }
    // Refresh unread count (in case there's a new notification)
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe to real-time events
  useSocketEvent(socket, "new_notification", handleNewNotification);
  useSocketEvent(socket, "order_updated", handleOrderUpdate);

  // ✅ Fix: Get session status to check if ready
  const { status: sessionStatus } = useSession();

  // ✅ Performance: Use polling hook with proper cleanup
  useEffect(() => {
    // ✅ Fix: Only fetch if session is authenticated (not loading)
    if (sessionStatus === "authenticated") {
      // Small delay to ensure session cookies are ready
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchUnreadCount, sessionStatus]);

  // ✅ Performance: Use polling hook instead of manual setInterval
  // Only poll if socket is not connected (fallback) AND session is authenticated
  usePolling(fetchUnreadCount, 30000, !isConnected && sessionStatus === "authenticated");

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: "/login",
        redirect: false, // Don't redirect automatically, we'll handle it
      });
      // If successful, redirect manually
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: clear session and redirect manually
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }
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
      <div className="w-full px-2 sm:px-4 h-16 flex items-center justify-between gap-2" suppressHydrationWarning>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1" suppressHydrationWarning>
          <Link 
            href="/dashboard/orders" 
            prefetch={false}
            className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap flex-shrink-0"
          >
            {t('home.ataGenerators')}
          </Link>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-1 min-w-0 overflow-x-auto scrollbar-hide" suppressHydrationWarning>
            <Link 
              href="/dashboard"
              prefetch={false}
            >
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                suppressHydrationWarning
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('navbar.dashboard')}
              </Button>
            </Link>

            <Link 
              href="/dashboard/orders"
              prefetch={false}
            >
              <Button
                variant={pathname.startsWith("/dashboard/orders") ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
              >
                <Package className="mr-2 h-4 w-4" />
                {t('navbar.orders')}
              </Button>
            </Link>
            
            <Link 
              href="/dashboard/notifications"
              prefetch={false}
            >
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

            <Link 
              href="/dashboard/calendar"
              prefetch={false}
            >
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
              <Link 
                href="/dashboard/clients"
                prefetch={false}
              >
                <Button
                  variant={pathname === "/dashboard/clients" ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  <User className="mr-2 h-4 w-4" />
                  {t('clients.title')}
                </Button>
              </Link>
            )}

            {/* Our Team Dashboard - Only for Technicians and Supervisors */}
            {(user.role === "TECHNICIAN" || user.role === "SUPERVISOR") && (
              <Link 
                href="/team"
                prefetch={false}
              >
                <Button
                  variant={pathname.startsWith("/team") ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('home.ourTeam')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile/Tablet Menu Button */}
          <div className="lg:hidden flex items-center" suppressHydrationWarning>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard" 
                    prefetch={false}
                    className="flex items-center"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/orders" 
                    prefetch={false}
                    className="flex items-center"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/notifications" 
                    prefetch={false}
                    className="flex items-center"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/calendar" 
                    prefetch={false}
                    className="flex items-center"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Link>
                </DropdownMenuItem>
                {/* Clients - Admin Only */}
                {user.role === "ADMIN" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/dashboard/clients" 
                        prefetch={false}
                        className="flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Clients
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/dashboard/company-knowledge" 
                        prefetch={false}
                        className="flex items-center"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Company Knowledge
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {(user.role === "TECHNICIAN" || user.role === "SUPERVISOR") && (
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/team" 
                      prefetch={false}
                      className="flex items-center"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Our Team
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" suppressHydrationWarning>
          {/* Module Switcher - Hidden on mobile, visible on xl+ */}
          <div className="hidden xl:block">
            <ModuleSwitcher currentModule="crm" />
          </div>
          
          {/* Language Toggle - Always visible but smaller on mobile */}
          <LanguageToggle />
          
          {/* Theme Toggle - Always visible */}
          <ThemeToggle />
          
          {/* Backup Button - Icon only on mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackup}
            disabled={isBackingUp}
            title="Database Backup"
            className="relative h-9 w-9"
          >
            <Database className={`h-4 w-4 sm:h-5 sm:w-5 ${isBackingUp ? 'animate-pulse' : ''}`} />
          </Button>
          
          {/* Notifications Bell - Mobile only (visible in desktop nav) */}
          <Link href="/dashboard/notifications" prefetch={false} className="lg:hidden">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 h-9 px-1.5 sm:px-2" suppressHydrationWarning>
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0" suppressHydrationWarning>
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="hidden sm:flex flex-col items-start min-w-0" suppressHydrationWarning>
                  <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] md:max-w-none">{user.name}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[80px] md:max-w-none">{user.role}</span>
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

