"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryNoteCreatorProps {
  orderId: number;
  orderItems?: any[];
}

export function DeliveryNoteCreator({
  orderId,
  orderItems = [],
}: DeliveryNoteCreatorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [dnNumber, setDnNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [dnFiles, setDnFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setDnFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB per file
  });

  const removeFile = (index: number) => {
    setDnFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!dnNumber.trim()) {
      toast({
        title: "⚠️ خطأ في البيانات",
        description: "الرجاء إدخال رقم Delivery Note",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("dnNumber", dnNumber.trim());
      formData.append("items", JSON.stringify(orderItems));
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }
      // Append all files
      dnFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/orders/${orderId}/delivery-note`, {
        method: "POST",
        credentials: "include", // ✅ Critical: Include credentials for authentication
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "✅ تم إنشاء Delivery Note بنجاح!",
          description: `تم إنشاء DN #${dnNumber} وإرسال إشعار للعميل`,
          className: "bg-green-50 border-green-200",
        });
        setDnNumber("");
        setNotes("");
        setDnFiles([]);
        // ✅ Performance: Invalidate cache and refresh instead of full page reload
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setTimeout(() => router.refresh(), 500);
      } else {
        toast({
          title: "❌ خطأ في إنشاء DN",
          description: result.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delivery note error:", error);
      toast({
        title: "❌ فشل الاتصال",
        description: "تعذر الاتصال بالسيرفر. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚚 Create Delivery Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="dnNumber">Delivery Note Number *</Label>
          <Input
            id="dnNumber"
            placeholder="e.g., DN-2025-001"
            value={dnNumber}
            onChange={(e) => setDnNumber(e.target.value)}
          />
        </div>

        <div>
          <Label>Items to Deliver</Label>
          <div className="border rounded p-3 bg-gray-50 max-h-40 overflow-y-auto">
            {orderItems.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {orderItems.map((item: any, idx: number) => (
                  <li key={idx}>
                    • {item.name} - Qty: {item.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No items found</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Delivery Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Special delivery instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* File Upload - Multiple Files */}
        <div>
          <Label>Upload Delivery Note Documents (Optional) - Max 10 files</Label>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            {isDragActive ? (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Drag & drop Delivery Note files here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports: PDF, PNG, JPG, DOC, DOCX (Max 10MB each)
                </p>
                {dnFiles.length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                    {dnFiles.length} file(s) selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Show selected files */}
          {dnFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {dnFiles.map((file, index) => (
                <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create & Send Delivery Note"}
        </Button>
      </CardContent>
    </Card>
  );
}

