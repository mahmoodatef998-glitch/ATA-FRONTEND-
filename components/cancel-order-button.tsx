"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface CancelOrderButtonProps {
  orderId: number;
  orderStage: string;
  hasQuotation: boolean;
  isLoggedIn: boolean;
}

export function CancelOrderButton({
  orderId,
  orderStage,
  hasQuotation,
  isLoggedIn,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Check if cancellation is allowed
  const allowedStages = ["RECEIVED", "UNDER_REVIEW", "QUOTATION_PREPARATION"];
  const canCancel = allowedStages.includes(orderStage) && !hasQuotation && isLoggedIn;

  if (!canCancel) {
    return null; // Don't show button if not in early stage
  }

  const handleCancel = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/client/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to cancel order");
      }

      // Success
      toast({
        title: "✅ Order Cancelled",
        description: "Your order has been cancelled successfully",
        className: "bg-green-50 border-green-200",
      });

      // Use startTransition for non-blocking UI updates
      setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 1000);

    } catch (error: any) {
      console.error("Cancel error:", error);
      toast({
        title: "❌ Failed to Cancel",
        description: error.message || "Could not cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="gap-2"
          disabled={loading}
        >
          <XCircle className="h-4 w-4" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Cancel Order #{orderId}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>Are you sure you want to cancel this order?</p>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Your order will be marked as cancelled</li>
                <li>Our team will be notified</li>
                <li>You can create a new order anytime</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              If you have any questions, please contact us before cancelling.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            No, Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Yes, Cancel Order
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

