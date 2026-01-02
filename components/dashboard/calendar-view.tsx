"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, View } from "react-big-calendar";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Configure date-fns localizer (replaces moment.js)
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  companyId: number;
}

interface OrderEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: "order" | "delivery";
  orderId: number;
}

export function CalendarView({ companyId }: CalendarViewProps) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // ✅ Performance: Memoize fetchCalendarData to prevent re-creation
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/calendar?companyId=${companyId}`);
      const result = await response.json();

      if (result.success) {
        const calendarEvents: OrderEvent[] = [];

        // Add order events
        result.data.orders.forEach((order: any) => {
          calendarEvents.push({
            id: order.id,
            title: `Order #${order.id} - ${order.clients?.name || "Unknown"}`,
            start: new Date(order.createdAt),
            end: new Date(order.createdAt),
            type: "order",
            orderId: order.id,
          });
        });

        // Add delivery note events
        result.data.deliveryNotes.forEach((dn: any) => {
          const deliveryDate = dn.deliveredAt ? new Date(dn.deliveredAt) : new Date(dn.createdAt);
          calendarEvents.push({
            id: dn.id + 10000, // Offset to avoid conflicts
            title: `DN #${dn.dnNumber} - Order #${dn.orderId}`,
            start: deliveryDate,
            end: deliveryDate,
            type: "delivery",
            orderId: dn.orderId,
          });
        });

        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const eventStyleGetter = (event: OrderEvent) => {
    const backgroundColor = event.type === "order" ? "#3b82f6" : "#10b981";
    const borderColor = event.type === "order" ? "#2563eb" : "#059669";
    
    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "2px",
        borderRadius: "4px",
        color: "white",
        padding: "4px",
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        eventPropGetter={eventStyleGetter}
        tooltipAccessor={(event) => event.title}
        popup
      />
    </div>
  );
}

