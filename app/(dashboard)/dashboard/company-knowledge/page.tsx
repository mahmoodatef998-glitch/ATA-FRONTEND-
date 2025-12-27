"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

interface CompanyKnowledge {
  description?: string;
  products?: string;
  services?: string;
  contactInfo?: string;
  businessHours?: string;
  specialties?: string;
}

export default function CompanyKnowledgePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [knowledge, setKnowledge] = useState<CompanyKnowledge>({
    description: "",
    products: "",
    services: "",
    contactInfo: "",
    businessHours: "",
    specialties: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role !== UserRole.ADMIN) {
        // Redirect non-admins
        window.location.href = "/dashboard";
        return;
      }
      fetchCompanyKnowledge();
    }
  }, [status, session]);

  const fetchCompanyKnowledge = async () => {
    try {
      const response = await fetch("/api/company/knowledge");
      const data = await response.json();

      if (data.success && data.data) {
        setKnowledge({
          description: data.data.description || "",
          products: data.data.products || "",
          services: data.data.services || "",
          contactInfo: data.data.contactInfo || "",
          businessHours: data.data.businessHours || "",
          specialties: data.data.specialties || "",
        });
      }
    } catch (error) {
      console.error("Error fetching company knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to load company knowledge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/company/knowledge", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(knowledge),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Company knowledge updated successfully",
        });
      } else {
        throw new Error(data.error || "Failed to update");
      }
    } catch (error: any) {
      console.error("Error saving company knowledge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save company knowledge",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Knowledge Base</h1>
        <p className="text-muted-foreground mt-2">
          Update company information that will be used by the AI chatbot to answer client questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            This information helps the chatbot provide accurate answers about your company, products, and services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your company..."
              value={knowledge.description}
              onChange={(e) => setKnowledge({ ...knowledge, description: e.target.value })}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              A brief overview of your company and what you do.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="products">Products & Services</Label>
            <Textarea
              id="products"
              placeholder="List your main products and services..."
              value={knowledge.products}
              onChange={(e) => setKnowledge({ ...knowledge, products: e.target.value })}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Describe your main products and services (e.g., generators, ATS, switchgear, spare parts).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="services">Services Description</Label>
            <Textarea
              id="services"
              placeholder="Detailed services description..."
              value={knowledge.services}
              onChange={(e) => setKnowledge({ ...knowledge, services: e.target.value })}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Additional details about services you offer.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties & Expertise</Label>
            <Textarea
              id="specialties"
              placeholder="Company specialties and areas of expertise..."
              value={knowledge.specialties}
              onChange={(e) => setKnowledge({ ...knowledge, specialties: e.target.value })}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              What your company specializes in or is known for.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Textarea
              id="contactInfo"
              placeholder="Phone: +971 XX XXX XXXX&#10;Email: info@company.com&#10;Address: ..."
              value={knowledge.contactInfo}
              onChange={(e) => setKnowledge({ ...knowledge, contactInfo: e.target.value })}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Phone, email, and address information.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessHours">Business Hours</Label>
            <Textarea
              id="businessHours"
              placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 9:00 AM - 1:00 PM&#10;Sunday: Closed"
              value={knowledge.businessHours}
              onChange={(e) => setKnowledge({ ...knowledge, businessHours: e.target.value })}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Your company's operating hours.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

