import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for heavy calendar component (react-big-calendar is ~200KB)
const CalendarView = dynamic(
  () => import("@/components/dashboard/calendar-view").then(mod => ({ default: mod.CalendarView })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    ),
    ssr: false, // Calendar is client-side only
  }
);

export default async function CalendarPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Calendar
        </h1>
        <p className="text-muted-foreground">
          View orders and delivery notes on calendar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders & Delivery Notes Calendar</CardTitle>
          <CardDescription>
            View all orders and delivery notes scheduled on calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView companyId={session.user.companyId!} />
        </CardContent>
      </Card>
    </div>
  );
}

