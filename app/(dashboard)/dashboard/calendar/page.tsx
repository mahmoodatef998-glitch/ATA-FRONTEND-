import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/dashboard/calendar-view";

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

