"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuotationManagerProps {
  orderId: number;
  orderTotal?: number;
  currency?: string;
}

export function QuotationManager({ orderId, orderTotal, currency = "AED" }: QuotationManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercent, setDepositPercent] = useState("30");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const depositAmount = depositRequired && total
    ? (parseFloat(total) * parseFloat(depositPercent || "0")) / 100
    : 0;

  // Same approach as PO and Delivery Note - simple onDrop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  // Same dropzone config as PO and Delivery Note
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDropRejected: (fileRejections) => {
      // Show error for rejected files
      const rejection = fileRejections[0];
      if (rejection.errors[0]) {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          toast({
            title: "⚠️ File too large",
            description: "File size must be less than 10MB",
            variant: "destructive",
          });
        } else if (error.code === 'file-invalid-type') {
          toast({
            title: "⚠️ Invalid file type",
            description: "File must be PDF or Excel (.pdf, .xls, .xlsx)",
            variant: "destructive",
          });
        } else {
          toast({
            title: "⚠️ File error",
            description: error.message || "Unsupported file",
            variant: "destructive",
          });
        }
      }
    },
  });

  const handleSubmit = async () => {
    if (!total || parseFloat(total) <= 0) {
      toast({
        title: "⚠️ Missing data",
        description: "Please enter the total amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "⚠️ Missing file",
        description: "Please select a quotation file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create FormData (exactly like PO and Delivery Note)
      const formData = new FormData();
      formData.append("total", total);
      formData.append("currency", currency);
      formData.append("depositRequired", depositRequired.toString());
      if (depositRequired) {
        formData.append("depositPercent", depositPercent);
      }
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }
      formData.append("file", selectedFile);

      const response = await fetch(`/api/orders/${orderId}/quotations`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "✅ Quotation created successfully!",
          description: `Quotation has been created and a notification sent to the client`,
          className: "bg-green-50 border-green-200",
        });
        setTotal("");
        setNotes("");
        setSelectedFile(null);
        // ✅ Performance: Invalidate cache and refresh instead of full page reload
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setTimeout(() => router.refresh(), 500);
      } else {
        toast({
          title: "❌ Failed to create quotation",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Quotation creation error:", error);
      toast({
        title: "❌ Connection failed",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📄 Create Quotation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Amount */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="total">Total Amount *</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={currency}
              onChange={() => {}}
              placeholder="AED"
              disabled
            />
          </div>
        </div>

        {/* Deposit Payment */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="depositRequired"
            checked={depositRequired}
            onCheckedChange={(checked) => setDepositRequired(checked as boolean)}
          />
          <Label htmlFor="depositRequired" className="cursor-pointer">
            Require deposit payment before manufacturing
          </Label>
        </div>

        {depositRequired && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="depositPercent">Deposit Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="depositPercent"
                type="number"
                min="1"
                max="100"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            {total && (
              <p className="text-sm text-blue-600 font-medium">
                Deposit Amount: {depositAmount.toLocaleString()} {currency}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Payment terms, delivery time, etc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* File Upload - Drag & Drop (exactly like PO and Delivery Note) */}
        <div>
          <Label className="mb-2 block">Quotation File *</Label>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive ? "Drop the file here" : "Drag & drop quotation file here"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to select file (PDF, Excel - Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading || !selectedFile || !total} className="w-full">
          {loading ? (
            <>
              <Upload className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Create Quotation & Notify Client
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
