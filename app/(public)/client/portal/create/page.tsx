"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeft, Package, Upload, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [items, setItems] = useState([
    { name: "", quantity: 1, specs: "" },
  ]);

  // Dropzone for file upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles].slice(0, 5));
    },
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, specs: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📤 Submitting order from client portal...");
      
      // Validate items
      const validItems = items.filter(item => item.name.trim());
      
      if (validItems.length === 0) {
        throw new Error("Please add at least one item");
      }

      console.log("✅ Valid items:", validItems);

      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append("items", JSON.stringify(validItems));
      
      // Add files
      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch("/api/client/orders/create", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Response status:", response.status);
      const data = await response.json();
      console.log("📥 Response data:", data);

      if (!response.ok) {
        console.error("❌ API Error:", data);
        throw new Error(data.error || "Failed to create order");
      }

      console.log("✅ Order created successfully! ID:", data.data.orderId);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Redirect to portal with success message
      router.push("/client/portal?success=order-created");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Error creating order:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/client/portal">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Order</CardTitle>
                <CardDescription>
                  Submit a new purchase order request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Order Items</Label>
                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label htmlFor={`item-name-${index}`}>
                          Product/Service Name *
                        </Label>
                        <Input
                          id={`item-name-${index}`}
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          placeholder="e.g., Diesel Generator 500KVA, ATS Panel, Switchgear Parts"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`item-quantity-${index}`}>Quantity *</Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseInt(e.target.value) || 1)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`item-specs-${index}`}>
                        Specifications (Optional)
                      </Label>
                      <Textarea
                        id={`item-specs-${index}`}
                        value={item.specs}
                        onChange={(e) => updateItem(index, "specs", e.target.value)}
                        placeholder="e.g., 500KVA, 380V, Deep Sea Controller, Cummins Engine, IP54 Rating..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Attachments (Optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Upload designs, drawings, or reference images (Max 5 files, 10MB each)
                </p>
                
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-primary font-medium">Drop files here...</p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: Images (PNG, JPG), PDF, Word (DOCX)
                      </p>
                    </div>
                  )}
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length}/5):</p>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Submit Order
                    </>
                  )}
                </Button>
                
                <Link href="/client/portal" className="flex-shrink-0">
                  <Button type="button" variant="outline" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Your order will be reviewed by our team and you&apos;ll receive a professional quotation shortly.
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
                  💡 <strong>Examples:</strong> Diesel Generators (50-2000 KVA), ATS Panels, Switchgear, Control Panels, Generator Parts, Maintenance Services
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

