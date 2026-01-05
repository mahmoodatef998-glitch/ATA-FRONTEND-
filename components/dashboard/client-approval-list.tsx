"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, User, Phone, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  accountStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  approvedAt: string | null;
  approvedBy: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejectionReason: string | null;
  orders: Array<{ id: number }>;
}

interface ClientApprovalListProps {
  initialClients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ClientApprovalList({ initialClients, pagination }: ClientApprovalListProps) {
  const [clients, setClients] = useState(initialClients);
  const [processing, setProcessing] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleApprove = async (clientId: number) => {
    setProcessing(clientId);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Critical: Include credentials for authentication
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Client Approved",
          description: `Client account has been approved successfully.`,
        });
        // Remove from list
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        // Use startTransition for non-blocking UI updates
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve client",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve client",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (clientId: number, reason?: string) => {
    const rejectionReason = reason || prompt("Please provide a reason for rejection:");
    
    if (!rejectionReason) {
      return;
    }

    setProcessing(clientId);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Critical: Include credentials for authentication
        body: JSON.stringify({ action: "reject", rejectionReason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Client Rejected",
          description: `Client account has been rejected.`,
        });
        // Remove from list
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        // Use startTransition for non-blocking UI updates
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject client",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject client",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Clients</h3>
            <p className="text-muted-foreground">
              All client accounts have been processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Client Approvals ({pagination.total})</CardTitle>
        <CardDescription>
          Review and approve client account registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Approval
                    </Badge>
                  </div>
                  
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>Registered: {formatDateTime(client.createdAt)}</p>
                    {client.orders.length > 0 && (
                      <p className="mt-1">
                        Has {client.orders.length} existing order(s)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    onClick={() => handleApprove(client.id)}
                    disabled={processing === client.id}
                  >
                    {processing === client.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                    onClick={() => handleReject(client.id)}
                    disabled={processing === client.id}
                  >
                    {processing === client.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

