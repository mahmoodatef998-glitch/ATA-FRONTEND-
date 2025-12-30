import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { Navbar } from "@/components/dashboard/navbar";
import { Toaster } from "@/components/ui/toaster";
import { DataPrefetcher } from "@/components/dashboard/data-prefetcher";
import { UserRole } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect team members to their dashboard
  if (session.user.role === UserRole.TECHNICIAN || session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.HR) {
    redirect("/team");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" suppressHydrationWarning>
      <Navbar user={session.user} />
      <main className="container mx-auto px-4 py-8" suppressHydrationWarning>
        <DataPrefetcher />
        {children}
      </main>
      <Toaster />
    </div>
  );
}

