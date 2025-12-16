"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get callbackUrl from query params
  const callbackUrl = searchParams.get("callbackUrl") || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Show more specific error message
        let errorMessage = "Failed to sign in. Please try again.";
        
        // NextAuth returns different error types
        if (result.error === "CredentialsSignin") {
          errorMessage = "Username or password incorrect";
        } else if (result.error === "Configuration") {
          // Configuration error - this usually means NEXTAUTH_SECRET is missing or invalid
          // In development, try to continue with a user-friendly message
          errorMessage = "Authentication service is temporarily unavailable. Please try again in a moment.";
          console.error("NextAuth Configuration Error:", {
            message: "NEXTAUTH_SECRET may be missing or invalid",
            solution: "1. Check if .env file exists in project root\n2. Verify NEXTAUTH_SECRET is at least 32 characters\n3. Restart the development server\n4. Check server console for detailed error messages",
            note: "In development mode, a fallback secret should be used automatically. If this error persists, check server-side logs."
          });
          // Don't show the error to user, just log it
          setError(errorMessage);
          setLoading(false);
          return;
        } else if (result.error && typeof result.error === "string") {
          // Use the error message directly if it's a string
          errorMessage = result.error;
          
          // Check if error is about account status
          if (result.error.toLowerCase().includes("pending")) {
            errorMessage = "Your account is pending admin approval. Please wait for approval before logging in.";
          } else if (result.error.toLowerCase().includes("rejected")) {
            errorMessage = "Your account has been rejected. Please contact admin for more information.";
          } else if (result.error.toLowerCase().includes("invalid email") || result.error.toLowerCase().includes("invalid password") || result.error.toLowerCase().includes("username or password incorrect")) {
            errorMessage = "Username or password incorrect";
          } else if (result.error.toLowerCase().includes("configuration")) {
            errorMessage = "Authentication service is not properly configured. Please contact administrator.";
          }
        }
        
        setError(errorMessage);
        console.error("Login error:", result.error);
      } else if (result?.ok) {
        // Success - redirect to callbackUrl if provided, otherwise check role
        if (callbackUrl) {
          // Validate callbackUrl - don't redirect technicians/supervisors to /dashboard
          const callbackPath = new URL(callbackUrl, window.location.origin).pathname;
          if (callbackPath.startsWith("/dashboard")) {
            // Check role before redirecting to dashboard
            const response = await fetch("/api/auth/session");
            const sessionData = await response.json();
            
            if (sessionData?.user?.role === "TECHNICIAN" || sessionData?.user?.role === "SUPERVISOR" || sessionData?.user?.role === "HR") {
              // Redirect team members to /team instead of /dashboard (HR can only access Our Team section)
              router.push("/team");
            } else {
              router.push(callbackUrl);
            }
          } else {
            router.push(callbackUrl);
          }
        } else {
          // Check role and redirect accordingly
          const response = await fetch("/api/auth/session");
          const sessionData = await response.json();
          
          if (sessionData?.user?.role === "TECHNICIAN" || sessionData?.user?.role === "SUPERVISOR" || sessionData?.user?.role === "HR") {
            router.push("/team");
          } else {
            router.push("/dashboard");
          }
        }
        router.refresh();
      } else {
        setError("Unexpected error. Please try again.");
      }
    } catch (err) {
      console.error("Login exception:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="fixed top-6 left-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <span>←</span>
        <span>Back to Home</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your ATA CRM account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@demo.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-sm text-center text-gray-600 mt-4">
              <p className="font-semibold mb-2">Demo Credentials:</p>
              <div className="bg-blue-50 p-3 rounded-md space-y-1">
                <p className="font-mono text-sm">
                  📧 admin@demo.co
                </p>
                <p className="font-mono text-sm">
                  🔑 00243540000
                </p>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

