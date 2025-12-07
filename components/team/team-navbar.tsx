"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Package, Clock, TrendingUp, LayoutDashboard, Users, Home, User, CheckCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
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

export function TeamNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isTechnician = session?.user?.role === UserRole.TECHNICIAN;
  const isSupervisor = 
    session?.user?.role === UserRole.SUPERVISOR || 
    session?.user?.role === UserRole.ADMIN ||
    session?.user?.role === UserRole.OPERATIONS_MANAGER ||
    session?.user?.role === UserRole.HR;
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2 overflow-hidden">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/team" className="flex items-center gap-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent whitespace-nowrap hidden sm:inline">
                Our Team
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 justify-center overflow-hidden">
            <Link href="/team">
              <Button
                variant={pathname === "/team" || (isTechnician && pathname === "/team") ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0 text-xs px-2"
              >
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden lg:inline">Dashboard</span>
                <span className="lg:hidden">Home</span>
              </Button>
            </Link>

            {/* For Technicians */}
            {isTechnician && (
              <Link href="/team/technician">
                <Button
                  variant={pathname === "/team/technician" || pathname.startsWith("/team/technician") ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0 text-xs px-2"
                >
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden lg:inline">My Tasks</span>
                  <span className="lg:hidden">Tasks</span>
                </Button>
              </Link>
            )}

            {/* For Supervisors & Admins */}
            {isSupervisor && (
              <>
                <Link href="/team/members">
                  <Button
                    variant={pathname.startsWith("/team/members") ? "default" : "ghost"}
                    size="sm"
                    className="whitespace-nowrap flex-shrink-0 text-xs px-2"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Team Members</span>
                    <span className="lg:hidden">Team</span>
                  </Button>
                </Link>
                <Link href="/team/tasks">
                  <Button
                    variant={pathname.startsWith("/team/tasks") ? "default" : "ghost"}
                    size="sm"
                    className="whitespace-nowrap flex-shrink-0 text-xs px-2"
                  >
                    <Package className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden lg:inline">All Tasks</span>
                    <span className="lg:hidden">Tasks</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Approval Tab - Only for Admin */}
            {isAdmin && (
              <Link href="/team/approval">
                <Button
                  variant={pathname.startsWith("/team/approval") ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0 text-xs px-2"
                >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Approval</span>
                  <span className="lg:hidden">Approve</span>
                </Button>
              </Link>
            )}


            <Link href="/team/attendance">
              <Button
                variant={pathname === "/team/attendance" ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap flex-shrink-0 text-xs px-2"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden lg:inline">Attendance</span>
                <span className="lg:hidden">Attend</span>
              </Button>
            </Link>

            <Link href="/team/kpi">
              <Button
                variant={pathname === "/team/kpi" ? "default" : "ghost"}
                size="icon"
                title="Performance"
                className="flex-shrink-0 h-8 w-8"
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Module Switcher - Only for Admin, Operations Manager, Accountant, Supervisor */}
            <div className="hidden xl:block">
              <ModuleSwitcher currentModule="team" />
            </div>
            
            {/* Register Button - Only show if not logged in or for new registrations */}
            {!session && (
              <Link href="/team/register">
                <Button variant="outline" size="sm" className="whitespace-nowrap text-xs px-2">
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Register</span>
                  <span className="lg:hidden">Reg</span>
                </Button>
              </Link>
            )}
            
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Home Button */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
                <Home className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {/* User Menu - Same style as Client Navbar */}
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 flex-shrink-0 px-1.5">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="hidden lg:flex flex-col items-start min-w-0">
                      <span className="text-xs font-medium truncate max-w-[100px]">{session.user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {session.user.role?.replace('_', ' ') || 'User'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.role?.replace('_', ' ') || 'User'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Link href="/team">
              <Button
                variant={pathname === "/team" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
              >
                <LayoutDashboard className="h-3 w-3 mr-1" />
                Home
              </Button>
            </Link>

            {isTechnician && (
              <Link href="/team/technician">
                <Button
                  variant={pathname === "/team/technician" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Tasks
                </Button>
              </Link>
            )}

            {isSupervisor && (
              <>
                <Link href="/team/members">
                  <Button
                    variant={pathname.startsWith("/team/members") ? "default" : "ghost"}
                    size="sm"
                    className="text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Team
                  </Button>
                </Link>
                <Link href="/team/tasks">
                  <Button
                    variant={pathname.startsWith("/team/tasks") ? "default" : "ghost"}
                    size="sm"
                    className="text-xs"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Tasks
                  </Button>
                </Link>
              </>
            )}

            {/* Approval Tab - Only for Admin (Mobile) */}
            {isAdmin && (
              <Link href="/team/approval">
                <Button
                  variant={pathname.startsWith("/team/approval") ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approval
                </Button>
              </Link>
            )}


            <Link href="/team/attendance">
              <Button
                variant={pathname === "/team/attendance" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Attendance
              </Button>
            </Link>

            <Link href="/team/kpi">
              <Button
                variant={pathname === "/team/kpi" ? "default" : "ghost"}
                size="icon"
                className="text-xs"
                title="Performance"
              >
                <TrendingUp className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

