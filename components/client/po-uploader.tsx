"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface POUploaderProps {
  orderId?: number;
  uploadUrl: string;
  onSuccess?: () => void;
}

export function POUploader({ orderId, uploadUrl, onSuccess }: POUploaderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [depositFiles, setDepositFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const onDepositDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setDepositFiles(prev => [...prev, ...acceptedFiles]);
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

  const {
    getRootProps: getDepositRootProps,
    getInputProps: getDepositInputProps,
    isDragActive: isDepositDragActive,
  } = useDropzone({
    onDrop: onDepositDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeDepositFile = (index: number) => {
    setDepositFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!poNumber.trim()) {
      toast({
        title: "⚠️ Missing data",
        description: "Please enter the PO number",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "⚠️ Missing file",
        description: "Please upload at least one PO file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("poNumber", poNumber.trim());
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }
      // Append all PO files
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Append all deposit proof files
      depositFiles.forEach((file) => {
        formData.append("depositFiles", file);
      });

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "✅ PO uploaded successfully!",
          description: `Purchase Order #${poNumber} has been uploaded successfully`,
          className: "bg-green-50 border-green-200",
        });
        setPoNumber("");
        setNotes("");
        setUploadedFiles([]);
        setDepositFiles([]);
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        toast({
          title: "❌ PO upload failed",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("PO upload error:", error);
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
        <CardTitle>📄 Upload Purchase Order (PO)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PO Number */}
        <div>
          <Label htmlFor="poNumber">PO Number *</Label>
          <Input
            id="poNumber"
            placeholder="e.g., PO-2025-001"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* PO Files Upload - Drag & Drop - Multiple Files */}
        <div>
          <Label className="mb-2 block">Upload PO files (optional) - Max 10 files</Label>
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

        {/* Deposit Proof Upload - Cheque / Bank Slip */}
        <div>
          <Label className="mb-2 block">Upload deposit proof (cheque / bank slip) - optional</Label>
          <div
            {...getDepositRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
              ${isDepositDragActive 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <input {...getDepositInputProps()} />
            <div>
              <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDepositDragActive ? "Drop cheque / receipt files here" : "Drag & drop cheque image or transfer file here"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to select files (PDF, PNG, JPG - Max 10MB each)
              </p>
              {depositFiles.length > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  {depositFiles.length} deposit proof file(s) selected
                </p>
              )}
            </div>
          </div>
          
          {/* Display deposit proof files */}
          {depositFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {depositFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
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
                    onClick={() => removeDepositFile(index)}
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
          {loading ? "Uploading..." : "Upload PO"}
        </Button>
      </CardContent>
    </Card>
  );
}

