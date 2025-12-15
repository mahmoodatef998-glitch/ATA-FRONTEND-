"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamNavbar } from "@/components/team/team-navbar";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@prisma/client";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check if user has access to team features
  const hasTeamAccess = 
    session?.user?.role === UserRole.ADMIN ||
    session?.user?.role === UserRole.OPERATIONS_MANAGER ||
    session?.user?.role === UserRole.HR ||
    session?.user?.role === UserRole.SUPERVISOR ||
    session?.user?.role === UserRole.TECHNICIAN ||
    session?.user?.role === UserRole.ACCOUNTANT; // Accountant can access team module for attendance

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/team");
    } else if (status === "authenticated" && !hasTeamAccess) {
      router.push("/dashboard");
    }
  }, [status, hasTeamAccess, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || !hasTeamAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" suppressHydrationWarning>
      <TeamNavbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <Toaster />
    </div>
  );
}

