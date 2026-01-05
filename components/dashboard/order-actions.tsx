"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface OrderActionsProps {
  orderId: number;
  currentStatus: OrderStatus;
  publicToken?: string;
}

export function OrderActions({ orderId, currentStatus, publicToken }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | "complete" | null>(null);
  // Optimistic UI: Track optimistic status for immediate feedback
  const [optimisticStatus, setOptimisticStatus] = useState<OrderStatus | null>(null);

  const handleStatusChange = async (newStatus: OrderStatus, actionNote?: string) => {
    // OPTIMISTIC UI: Update UI immediately before API call
    setOptimisticStatus(newStatus);
    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Critical: Include credentials for authentication
        body: JSON.stringify({
          status: newStatus,
          note: actionNote || note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert optimistic update on error
        setOptimisticStatus(null);
        throw new Error(data.error || "Failed to update status");
      }

      setOpen(false);
      setNote("");
      setSelectedAction(null);
      setOptimisticStatus(null); // Clear optimistic status after success
      
      // Use startTransition for non-blocking UI updates
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticStatus(null);
      alert(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (action: "approve" | "reject" | "complete") => {
    setSelectedAction(action);
    setOpen(true);
  };

  const getDialogContent = () => {
    switch (selectedAction) {
      case "approve":
        return {
          title: "Approve Order",
          description: "This will change the order status to APPROVED",
          confirmText: "Approve",
          status: OrderStatus.APPROVED,
        };
      case "reject":
        return {
          title: "Reject Order",
          description: "This will change the order status to REJECTED",
          confirmText: "Reject",
          status: OrderStatus.REJECTED,
        };
      case "complete":
        return {
          title: "Complete Order",
          description: "This will mark the order as COMPLETED",
          confirmText: "Complete",
          status: OrderStatus.COMPLETED,
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();

  const handleCopyTrackingLink = () => {
    if (publicToken) {
      const url = `${window.location.origin}/order/track/${publicToken}`;
      navigator.clipboard.writeText(url);
      alert("Tracking link copied to clipboard!");
    }
  };

  // Use optimistic status if available, otherwise use current status
  const displayStatus = optimisticStatus || currentStatus;

  return (
    <div className="space-y-2" suppressHydrationWarning>
      {displayStatus === OrderStatus.PENDING && (
        <>
          <Button
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => openDialog("approve")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Order
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => openDialog("reject")}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Order
          </Button>
        </>
      )}

      {(displayStatus === OrderStatus.APPROVED || displayStatus === OrderStatus.QUOTATION_SENT) && (
        <Button
          variant="default"
          className="w-full"
          onClick={() => openDialog("complete")}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Completed
        </Button>
      )}

      {publicToken && (
        <div className="pt-4 border-t" suppressHydrationWarning>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopyTrackingLink}
          >
            Copy Tracking Link
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>{dialogContent?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for this action..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => dialogContent && handleStatusChange(dialogContent.status)}
              disabled={loading}
              variant={selectedAction === "reject" ? "destructive" : "default"}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                dialogContent?.confirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

