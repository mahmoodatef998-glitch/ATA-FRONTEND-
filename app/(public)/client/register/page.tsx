"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { checkPasswordStrength, validatePhoneNumber, normalizePhoneNumber } from "@/lib/validators/client-registration";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ strength: "weak" | "medium" | "strong"; feedback: string[]; valid?: boolean } | null>(null);
  const [phoneError, setPhoneError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    website: "", // Honeypot field
  });

  // Validate password strength on change
  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  // Validate phone number on change
  useEffect(() => {
    if (formData.phone) {
      const normalized = normalizePhoneNumber(formData.phone);
      if (normalized && !validatePhoneNumber(normalized)) {
        setPhoneError("Please enter a valid phone number");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }, [formData.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneError("");

    // Client-side validation
    if (!formData.name || formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);
    if (!normalizedPhone || !validatePhoneNumber(normalizedPhone)) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    // Validate email (required)
    if (!formData.email || formData.email.trim() === "") {
      setError("Email is required");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const strength = checkPasswordStrength(formData.password);
    if (!strength.valid) {
      setError("Password is too weak. " + strength.feedback.join(", "));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Honeypot check
    if (formData.website) {
      // Bot detected - silently fail
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/client/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: normalizedPhone,
          email: formData.email, // Required now
          password: formData.password,
          website: formData.website, // Honeypot
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = "Registration failed. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!data.success) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      // Show success message and redirect to login
      // Account needs admin approval before login
      router.push("/client/login?registered=true");
    } catch (err: any) {
      // Handle different types of errors
      let errorMessage = "An error occurred. Please try again.";
      
      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Registration error:", err);
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
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Client Account</CardTitle>
          <CardDescription>
            Track your orders and view quotations anytime
          </CardDescription>
        </CardHeader>
        <CardContent suppressHydrationWarning>
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                minLength={2}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+971501234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                minLength={8}
                maxLength={20}
                disabled={loading}
                className={phoneError ? "border-red-500" : ""}
              />
              {phoneError && (
                <p className="text-xs text-red-600">{phoneError}</p>
              )}
              {!phoneError && formData.phone && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid phone number
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Use the same phone number you used for orders
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters with uppercase, lowercase, numbers"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                  className={passwordStrength && !passwordStrength.valid ? "border-red-500" : passwordStrength?.strength === "strong" ? "border-green-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.strength === "strong"
                            ? "bg-green-500 w-full"
                            : passwordStrength.strength === "medium"
                            ? "bg-yellow-500 w-2/3"
                            : "bg-red-500 w-1/3"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === "strong"
                        ? "text-green-600"
                        : passwordStrength.strength === "medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}>
                      {passwordStrength.strength.toUpperCase()}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {passwordStrength.feedback.map((msg, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          {passwordStrength.valid ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                  className={
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-500"
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-500"
                      : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`text-xs flex items-center gap-1 ${
                  formData.password === formData.confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Honeypot field - hidden from users */}
            <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
              <Label htmlFor="website">Website (leave blank)</Label>
              <Input
                id="website"
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/client/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




