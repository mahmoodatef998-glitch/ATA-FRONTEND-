"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, User, Home, LayoutDashboard, Bell } from "lucide-react";
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/client/portal" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ATA CRM
          </Link>

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
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications Bell Icon */}
          <Link href="/client/portal/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
          </Link>

          {/* New Order Button */}
          <Link href="/client/portal/create">
            <Button variant="default" size="sm" className="hidden sm:flex">
              <Package className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{clientName}</span>
                  <span className="text-xs text-muted-foreground">Client</span>
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
                <Link href="/client/portal/create">
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



