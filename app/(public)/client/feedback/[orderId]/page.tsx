"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

export default function ClientFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.orderId as string);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [deliveryExperience, setDeliveryExperience] = useState(0);
  const [comments, setComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    fetchOrderAndClient();
    checkExistingFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderAndClient = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/client/orders");
      if (response.ok) {
        const data = await response.json();
        const foundOrder = data.data.orders.find((o: any) => o.id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
          setClientId(foundOrder.clientId);
        } else {
          setError("Order not found");
        }
      } else {
        router.push("/client/login");
      }
    } catch (err) {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setExistingFeedback(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to check existing feedback");
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!clientId) {
      setError("Client information not found");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          clientId,
          rating,
          serviceQuality: serviceQuality || null,
          deliveryExperience: deliveryExperience || null,
          comments: comments.trim() || null,
          wouldRecommend,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Thank you for your feedback!");
        router.push("/client/portal");
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingFeedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Already Submitted</CardTitle>
              <CardDescription>You have already provided feedback for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Your Rating:</Label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= existingFeedback.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {existingFeedback.comments && (
                  <div>
                    <Label>Your Comments:</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {existingFeedback.comments}
                    </p>
                  </div>
                )}
                <Button onClick={() => router.push("/client/portal")} className="w-full">
                  Back to Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order || order.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {!order
                  ? "Order not found"
                  : "Feedback can only be provided for completed orders"}
              </p>
              <Button
                onClick={() => router.push("/client/portal")}
                className="w-full mt-4"
              >
                Back to Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Rate Your Experience</CardTitle>
            <CardDescription>
              Order #{orderId} - Help us improve our service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Overall Rating */}
            <div>
              <Label className="text-base font-semibold">Overall Rating *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                How would you rate your overall experience?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-lg font-semibold">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Service Quality */}
            <div>
              <Label className="text-base font-semibold">Service Quality</Label>
              <p className="text-sm text-muted-foreground mb-3">
                How would you rate the quality of our service?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setServiceQuality(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= serviceQuality
                          ? "fill-blue-400 text-blue-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Experience */}
            <div>
              <Label className="text-base font-semibold">Delivery Experience</Label>
              <p className="text-sm text-muted-foreground mb-3">
                How was your delivery experience?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDeliveryExperience(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= deliveryExperience
                          ? "fill-green-400 text-green-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <Label className="text-base font-semibold">Would you recommend us?</Label>
              <div className="flex gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                    wouldRecommend === true
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-300 hover:border-green-300"
                  }`}
                >
                  <ThumbsUp
                    className={`h-8 w-8 mx-auto mb-2 ${
                      wouldRecommend === true ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <p className="font-medium">Yes</p>
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                    wouldRecommend === false
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-gray-300 hover:border-red-300"
                  }`}
                >
                  <ThumbsDown
                    className={`h-8 w-8 mx-auto mb-2 ${
                      wouldRecommend === false ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                  <p className="font-medium">No</p>
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label htmlFor="comments" className="text-base font-semibold">
                Additional Comments
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Tell us more about your experience (optional)
              </p>
              <Textarea
                id="comments"
                placeholder="Your feedback helps us improve..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/client/portal")}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

