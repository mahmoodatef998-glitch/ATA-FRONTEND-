"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, CheckCircle, Clock, XCircle } from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    identifier: "", // email or phone
    password: "",
  });

  useEffect(() => {
    // Check if user just registered
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please wait for admin approval before you can login.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/client/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if account is pending or rejected
        if (data.accountStatus === "PENDING") {
          setError("Your account is pending approval. Please wait for admin approval before logging in.");
          return;
        }
        if (data.accountStatus === "REJECTED") {
          setError(data.error || "Your account has been rejected. Please contact support.");
          return;
        }
        // Use the error message from API, or default message
        const errorMsg = data.error || "Username or password incorrect";
        setError(errorMsg);
        return;
      }

      // Redirect to client portal
      router.push("/client/portal");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4" suppressHydrationWarning>
      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <span>←</span>
        <span>Back to Home</span>
      </Link>

      <Card className="w-full max-w-md" suppressHydrationWarning>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Client Portal Login</CardTitle>
          <CardDescription>
            Login to track your orders and view quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                Email or Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com or +971501234567"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your email address or phone number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {successMessage && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Account Created Successfully!
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start gap-3">
                  {error.includes("pending") ? (
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  ) : error.includes("rejected") ? (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {error.includes("pending") ? "Account Pending Approval" : error.includes("rejected") ? "Account Rejected" : "Login Error"}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <div className="text-center text-sm space-y-2">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/client/register" className="text-primary hover:underline font-medium">
                  Create Account
                </Link>
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                Create an account to submit and track your orders
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

