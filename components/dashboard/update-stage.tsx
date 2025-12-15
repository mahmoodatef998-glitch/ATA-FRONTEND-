"use client";

import { useState } from "react";
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
  const [stage, setStage] = useState<OrderStage>(currentStage);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (stage === currentStage) {
      return;
    }

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
        throw new Error("Failed to update stage");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating stage:", error);
      alert("Failed to update stage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Progress Stage</CardTitle>
        <CardDescription>Change the current progress stage of this order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={stage} onValueChange={(value) => setStage(value as OrderStage)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(stageLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={loading || stage === currentStage}
          className="w-full"
        >
          {loading ? (
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

