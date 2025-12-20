"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface WorkLogFormProps {
  taskId: number;
  onSuccess?: () => void;
}

export function WorkLogForm({ taskId, onSuccess }: WorkLogFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      setPhotos((prev) => [...prev, ...acceptedFiles].slice(0, 10));
    },
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description.trim()) {
        toast({
          title: "Error",
          description: "Description is required",
          variant: "destructive",
        });
        return;
      }

      if (!startTime) {
        toast({
          title: "Error",
          description: "Start time is required",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("taskId", taskId.toString());
      formData.append("description", description);
      formData.append("startTime", startTime);
      if (endTime) {
        formData.append("endTime", endTime);
      }

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const response = await fetch("/api/worklogs", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Work log submitted successfully!",
          description: "Your work log has been submitted for review",
          className: "bg-green-50 border-green-200",
        });
        setDescription("");
        setStartTime("");
        setEndTime("");
        setPhotos([]);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "❌ Submission failed",
          description: result.error || "Failed to submit work log",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Submit work log error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Work Log</CardTitle>
        <CardDescription>Record your work progress for this task</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work you completed..."
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Photos (Optional)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop photos here..."
                  : "Drag & drop photos here, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10 photos, 5MB each
              </p>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Work Log"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

