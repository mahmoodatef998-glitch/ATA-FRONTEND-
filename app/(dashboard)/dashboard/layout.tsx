import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-helpers";
import { Navbar } from "@/components/dashboard/navbar";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <Toaster />
    </div>
  );
}

