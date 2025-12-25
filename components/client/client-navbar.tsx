"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, User, Home, LayoutDashboard, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientNavbarProps {
  clientName: string;
  clientEmail?: string;
}

export function ClientNavbar({ clientName, clientEmail }: ClientNavbarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/client/logout", { method: "POST" });
    window.location.href = "/client/login";
  };

  return (
    <nav className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href="/client/portal" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap flex-shrink-0">
            ATA CRM
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/client/portal">
              <Button
                variant={pathname === "/client/portal" ? "default" : "ghost"}
                size="sm"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href="/client/portal/create">
              <Button
                variant={pathname.startsWith("/client/portal/create") ? "default" : "ghost"}
                size="sm"
              >
                <Package className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>

            <Link href="/client/portal/notifications">
              <Button
                variant={pathname === "/client/portal/notifications" ? "default" : "ghost"}
                size="sm"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
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
                  <Link href="/client/portal" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/portal/create" className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    New Order
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/portal/notifications" className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications Bell Icon - Mobile only (visible in desktop nav) */}
          <Link href="/client/portal/notifications" className="md:hidden">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>

          {/* New Order Button - Desktop only */}
          <Link href="/client/portal/create" className="hidden md:block">
            <Button variant="default" size="sm">
              <Package className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 h-9 px-1.5 sm:px-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="hidden sm:flex flex-col items-start min-w-0">
                  <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] md:max-w-none">{clientName}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Client</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{clientName}</p>
                  {clientEmail && (
                    <p className="text-xs text-muted-foreground">{clientEmail}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client/portal/create" className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  New Order
                </Link>
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



