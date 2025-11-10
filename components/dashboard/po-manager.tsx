"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";

interface POManagerProps {
  orderId: number;
  orderTotal?: number;
  currency?: string;
}

export function POManager({ orderId, orderTotal, currency = "AED" }: POManagerProps) {
  const [loading, setLoading] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercent, setDepositPercent] = useState("30");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const depositAmount = depositRequired && orderTotal
    ? (orderTotal * parseFloat(depositPercent || "0")) / 100
    : 0;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB per file
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!poNumber.trim()) {
      alert("Please enter PO Number");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("poNumber", poNumber.trim());
      formData.append("depositRequired", depositRequired.toString());
      if (depositRequired) {
        formData.append("depositPercent", depositPercent);
      }
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }
      // Append all files
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/orders/${orderId}/po`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ PO created successfully!");
        setPoNumber("");
        setNotes("");
        setUploadedFiles([]);
        window.location.reload();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("PO creation error:", error);
      alert("Failed to create PO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📄 Create Purchase Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="poNumber">PO Number *</Label>
          <Input
            id="poNumber"
            placeholder="e.g., PO-2025-001"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
        </div>

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
            {orderTotal && (
              <p className="text-sm text-blue-600 font-medium">
                Deposit Amount: {depositAmount.toLocaleString()} {currency}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes for the client..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* File Upload - Drag & Drop - Multiple Files */}
        <div>
          <Label className="mb-2 block">Upload PO Files (Optional) - Max 10 files</Label>
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
            <div>
              <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? "Drop the files here" : "Drag & drop PO files here"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to select files (PDF, DOC, DOCX, PNG, JPG - Max 10MB each)
              </p>
              {uploadedFiles.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  {uploadedFiles.length} file(s) selected
                </p>
              )}
            </div>
          </div>
          
          {/* Display uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create PO & Notify Client"}
        </Button>
      </CardContent>
    </Card>
  );
}

