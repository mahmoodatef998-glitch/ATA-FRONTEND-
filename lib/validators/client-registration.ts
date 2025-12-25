/**
 * Client Registration Validators
 * Enhanced validation for client registration form
 */

import { z } from "zod";

/**
 * Validate phone number (supports UAE, Saudi, and international formats)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces, dashes, and plus signs for validation
  const cleaned = phone.replace(/[\s\-+]/g, "");
  
  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) return false;
  
  // UAE format: 971XXXXXXXXX or 0XXXXXXXXX
  if (cleaned.startsWith("971") && cleaned.length === 12) return true;
  if (cleaned.startsWith("0") && cleaned.length === 10) return true;
  
  // Saudi format: 966XXXXXXXXX or 0XXXXXXXXX
  if (cleaned.startsWith("966") && cleaned.length === 12) return true;
  
  // International format: 8-15 digits
  if (cleaned.length >= 8 && cleaned.length <= 15) return true;
  
  return false;
}

/**
 * Normalize phone number (remove spaces, dashes, etc.)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  // Remove spaces, dashes, parentheses, and plus signs
  return phone.replace(/[\s\-+()]/g, "");
}

/**
 * Check password strength
 * Returns: { valid: boolean, strength: 'weak' | 'medium' | 'strong', feedback: string[] }
 */
export function checkPasswordStrength(password: string): {
  valid: boolean;
  strength: "weak" | "medium" | "strong";
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Password must be at least 8 characters");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add numbers");
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add special characters (!@#$%^&*)");
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  }

  return {
    valid: score >= 3 && password.length >= 8, // At least medium strength
    strength,
    feedback: feedback.length > 0 ? feedback : ["Password is strong!"],
  };
}

/**
 * Enhanced registration schema with better validation
 */
export const enhancedRegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, "Name can only contain letters and spaces"),
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 digits")
    .max(20, "Phone number is too long")
    .refine(
      (phone) => validatePhoneNumber(phone),
      "Please enter a valid phone number"
    ),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .refine(
      (password) => checkPasswordStrength(password).valid,
      "Password is too weak. Please use a stronger password."
    ),
  confirmPassword: z.string(),
  // Honeypot field (should be empty)
  website: z.string().max(0, "Bot detected").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

