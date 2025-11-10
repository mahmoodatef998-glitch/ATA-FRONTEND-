"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, X, Send } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface UploadQuotationSimpleProps {
  orderId: number;
  orderStatus: string;
}

export function UploadQuotationSimple({ orderId, orderStatus }: UploadQuotationSimpleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      
      if (!validTypes.includes(file.type)) {
        setError("Only PDF and Excel files are allowed");
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      
      setSelectedFile(file);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUploadAndSend = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter quotation amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create quotation with basic info
      const createResponse = await fetch(`/api/orders/${orderId}/quotations/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total: parseFloat(amount),
          currency,
          notes,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.error || "Failed to create quotation");
      }

      const { data: quotation } = await createResponse.json();

      // Step 2: Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(`/api/quotations/${quotation.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Send to client (notification)
      const sendResponse = await fetch(`/api/quotations/${quotation.id}/send`, {
        method: "POST",
      });

      if (!sendResponse.ok) {
        throw new Error("Failed to send notification");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Quotation Sent Successfully!
            </h3>
            <p className="text-sm text-green-700">
              Client has been notified and can now review the quotation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload & Send Quotation</CardTitle>
        <CardDescription>
          Upload your quotation file (PDF/Excel) and send it to the client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div>
          <Label>Quotation File *</Label>
          <div
            {...getRootProps()}
            className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
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
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium mb-1">
                  {isDragActive ? "Drop file here..." : "Drag & drop your quotation file"}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse (PDF, Excel - Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="amount">Total Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="AED"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, delivery time, etc..."
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleUploadAndSend}
          disabled={loading || !selectedFile || !amount}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading & Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Upload & Send to Client
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Client will receive a notification and can accept or reject the quotation
        </p>
      </CardContent>
    </Card>
  );
}









