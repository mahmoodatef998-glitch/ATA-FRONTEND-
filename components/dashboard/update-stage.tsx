"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { OrderStage } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateStageProps {
  orderId: number;
  currentStage: OrderStage;
}

const stageLabels: Record<OrderStage, string> = {
  RECEIVED: "📨 Received",
  UNDER_REVIEW: "👀 Under Review",
  QUOTATION_PREPARATION: "📝 Preparing Quotation",
  QUOTATION_SENT: "📤 Quotation Sent",
  QUOTATION_ACCEPTED: "✅ Quote Accepted",
  PO_PREPARED: "📄 PO Prepared",
  AWAITING_DEPOSIT: "💰 Awaiting Deposit",
  DEPOSIT_RECEIVED: "✔️ Deposit Received",
  IN_MANUFACTURING: "⚙️ Manufacturing",
  MANUFACTURING_COMPLETE: "✅ Manufacturing Done",
  READY_FOR_DELIVERY: "📦 Ready for Delivery",
  DELIVERY_NOTE_SENT: "📋 Delivery Note Sent",
  AWAITING_FINAL_PAYMENT: "💵 Final Payment Due",
  FINAL_PAYMENT_RECEIVED: "✔️ Payment Complete",
  COMPLETED_DELIVERED: "🎉 Completed",
};

export function UpdateStage({ orderId, currentStage }: UpdateStageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<OrderStage>(currentStage);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Optimistic UI: Track optimistic stage for immediate feedback
  const [optimisticStage, setOptimisticStage] = useState<OrderStage | null>(null);

  // Memoize stage options to prevent re-renders
  const stageOptions = useMemo(() => {
    return Object.entries(stageLabels).map(([key, label]) => ({
      value: key as OrderStage,
      label,
    }));
  }, []);

  // Optimize handleUpdate with useCallback and Optimistic UI
  const handleUpdate = useCallback(async () => {
    if (stage === currentStage || loading) {
      return;
    }

    // OPTIMISTIC UI: Update UI immediately before API call
    setOptimisticStage(stage);
    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setOptimisticStage(null);
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update stage");
      }

      // Clear optimistic stage after success
      setOptimisticStage(null);

      // Use startTransition to make refresh non-blocking
      startTransition(() => {
        router.refresh();
      });

      toast({
        title: "✅ Stage Updated",
        description: `Order stage has been updated successfully.`,
      });
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticStage(null);
      console.error("Error updating stage:", error);
      toast({
        title: "❌ Update Failed",
        description: error.message || "Failed to update stage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [stage, currentStage, loading, orderId, router, toast, startTransition]);

  // Optimize stage change handler
  const handleStageChange = useCallback((value: string) => {
    setStage(value as OrderStage);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Progress Stage</CardTitle>
        <CardDescription>Change the current progress stage of this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select 
            value={optimisticStage || stage} 
            onValueChange={handleStageChange}
            disabled={loading || isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage..." />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={loading || isPending || stage === currentStage}
          className="w-full"
          type="button"
        >
          {loading || isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Stage"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

