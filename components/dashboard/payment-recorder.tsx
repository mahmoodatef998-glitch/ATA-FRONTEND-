"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentRecorderProps {
  orderId: number;
  depositAmount?: number;
  totalAmount?: number;
  currency?: string;
}

export function PaymentRecorder({
  orderId,
  depositAmount,
  totalAmount,
  currency = "AED",
}: PaymentRecorderProps) {
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!paymentType || !amount) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod.trim() || null,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Payment recorded successfully!");
        setAmount("");
        setPaymentMethod("");
        setReference("");
        setNotes("");
        window.location.reload();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Payment recording error:", error);
      alert("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Record Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="paymentType">Payment Type *</Label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEPOSIT">Deposit Payment</SelectItem>
              <SelectItem value="FINAL">Final Payment</SelectItem>
              <SelectItem value="FULL">Full Payment</SelectItem>
              <SelectItem value="PARTIAL">Partial Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Amount ({currency}) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {paymentType === "DEPOSIT" && depositAmount && (
            <p className="text-sm text-blue-600 mt-1">
              Expected: {depositAmount.toLocaleString()} {currency}
            </p>
          )}
          {paymentType === "FINAL" && totalAmount && depositAmount && (
            <p className="text-sm text-blue-600 mt-1">
              Expected: {(totalAmount - depositAmount).toLocaleString()} {currency}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Input
            id="paymentMethod"
            placeholder="e.g., Bank Transfer, Cash, Cheque"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="reference">Reference/Transaction ID</Label>
          <Input
            id="reference"
            placeholder="e.g., TXN123456"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional payment details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Recording..." : "Record Payment"}
        </Button>
      </CardContent>
    </Card>
  );
}

