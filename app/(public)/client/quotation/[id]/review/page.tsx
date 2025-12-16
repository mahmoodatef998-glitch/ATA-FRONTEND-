"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CheckCircle, XCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { POUploader } from "@/components/client/po-uploader";
import { MarkActionViewed } from "@/components/client/mark-action-viewed";

export default function ReviewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<any>(null);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [clientComment, setClientComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setQuotationId(p.id));
  }, [params]);

  const handleAcceptWithComment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies
        body: JSON.stringify({ 
          accepted: true,
          clientComment: clientComment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => router.push("/client/login"), 2000);
          return;
        }
        throw new Error(data.error || "Failed to accept quotation");
      }

      router.push("/client/portal?success=accepted");
    } catch (err: any) {
      console.error("Error accepting quotation:", err);
      setError(err.message || "Failed to accept quotation");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies
        body: JSON.stringify({
          accepted: false,
          rejectionReason,
          clientComment: clientComment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.");
          setTimeout(() => router.push("/client/login"), 2000);
          return;
        }
        throw new Error(data.error || "Failed to reject quotation");
      }

      router.push("/client/portal?success=rejected");
    } catch (err: any) {
      console.error("Error rejecting quotation:", err);
      setError(err.message || "Failed to reject quotation");
    } finally {
      setLoading(false);
    }
  };

  // Fetch quotation details via client orders API
  useEffect(() => {
    if (!quotationId) return;
    
    const fetchQuotation = async () => {
      try {
        const response = await fetch("/api/client/orders", {
          credentials: "include", // Important: include cookies
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Save current URL to redirect back after login
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/client/login?returnUrl=${returnUrl}`);
            return;
          }
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        const orders = data.data.orders || [];
        
        // Find quotation in orders
        for (const order of orders) {
          const quote = order.quotations?.find((q: any) => q.id === parseInt(quotationId));
          if (quote) {
            setQuotation({ ...quote, order });
            return;
          }
        }

        setError("Quotation not found or you don't have permission to view it");
      } catch (err: any) {
        console.error("Error fetching quotation:", err);
        setError(err.message || "Failed to load quotation");
      }
    };

    fetchQuotation();
  }, [quotationId, router]);

  if (!quotation && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/client/portal">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Button>
        </Link>

        {error && !quotation ? (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/client/portal">
                <Button>Back to Portal</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Mark quotation action as viewed when viewing this page */}
            {quotation && quotation.accepted === null && (
              <MarkActionViewed orderId={quotation.order.id} actionType="quotation" />
            )}

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Review Quotation</CardTitle>
                    <CardDescription>
                      Order #{quotation.order.id} - Quotation #{quotation.id}
                    </CardDescription>
                  </div>
                  {quotation.accepted !== null && (
                    <Badge variant={quotation.accepted ? "default" : "destructive"}>
                      {quotation.accepted ? "Accepted" : "Rejected"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quotation Details */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(quotation.total, quotation.currency)}
                    </span>
                  </div>
                  
                  {quotation.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{quotation.notes}</p>
                    </div>
                  )}
                </div>

                {/* Download File */}
                {quotation.file && (
                  <div>
                    <a
                      href={quotation.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full" size="lg">
                        <Download className="h-4 w-4 mr-2" />
                        Download Quotation File
                      </Button>
                    </a>
                  </div>
                )}

                {/* Actions (only if not reviewed yet) */}
                {quotation.accepted === null && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Your Response:</h3>
                      
                      {/* Accept with optional comment */}
                      {!showRejectForm && (
                        <div className="space-y-3">
                          {showCommentForm && (
                            <div>
                              <Label htmlFor="clientComment">
                                Add Comment/Note (Optional)
                              </Label>
                              <Textarea
                                id="clientComment"
                                value={clientComment}
                                onChange={(e) => setClientComment(e.target.value)}
                                placeholder="e.g., Can you offer a better discount? Need faster delivery..."
                                rows={3}
                                className="mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Add any notes or requests before accepting
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button
                              onClick={handleAcceptWithComment}
                              disabled={loading}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              size="lg"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept Quotation
                                </>
                              )}
                            </Button>

                            {!showCommentForm && (
                              <Button
                                onClick={() => setShowCommentForm(true)}
                                variant="outline"
                                size="lg"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Note
                              </Button>
                            )}
                          </div>

                          <Button
                            onClick={() => {
                              setShowRejectForm(true);
                              setError("");
                            }}
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Quotation
                          </Button>
                        </div>
                      )}

                      {/* Reject Form */}
                      {showRejectForm && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="rejectionReason">
                              Reason for Rejection *
                            </Label>
                            <Textarea
                              id="rejectionReason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please tell us why you're rejecting this quotation..."
                              rows={3}
                              className="mt-2"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="clientCommentReject">
                              Additional Comments (Optional)
                            </Label>
                            <Textarea
                              id="clientCommentReject"
                              value={clientComment}
                              onChange={(e) => setClientComment(e.target.value)}
                              placeholder="e.g., Price too high, looking for alternative..."
                              rows={2}
                              className="mt-2"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={handleReject}
                              disabled={loading}
                              variant="destructive"
                              className="flex-1"
                              size="lg"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Confirm Rejection
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={() => {
                                setShowRejectForm(false);
                                setRejectionReason("");
                                setError("");
                              }}
                              variant="outline"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Already Reviewed */}
                {quotation.accepted !== null && (
                  <>
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start gap-3 mb-3">
                        {quotation.accepted ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">
                            {quotation.accepted ? "You accepted this quotation" : "You rejected this quotation"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Reviewed on {formatDateTime(quotation.reviewedAt)}
                          </p>
                        </div>
                      </div>

                      {quotation.rejectedReason && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium">Reason:</p>
                          <p className="text-sm text-muted-foreground mt-1">{quotation.rejectedReason}</p>
                        </div>
                      )}

                      {quotation.clientComment && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium">Your Note:</p>
                          <p className="text-sm text-muted-foreground mt-1">{quotation.clientComment}</p>
                        </div>
                      )}
                    </div>

                    {/* PO Uploader - Show only if quotation is accepted and order doesn't have PO yet */}
                    {quotation.accepted && quotation.order && (!quotation.order.purchase_orders || quotation.order.purchase_orders.length === 0) && (
                      <POUploader 
                        orderId={quotation.order.id}
                        uploadUrl={`/api/client/orders/${quotation.order.id}/po`}
                        onSuccess={() => {
                          // Refresh the page to show the uploaded PO
                          window.location.reload();
                        }}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}





