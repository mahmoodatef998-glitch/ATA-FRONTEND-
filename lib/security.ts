/**
 * Security Utilities
 * Functions for sanitization, validation, and security checks
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize plain text by removing HTML tags and special characters
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  // Remove HTML tags
  const withoutHtml = text.replace(/<[^>]*>/g, "");
  // Remove special characters that could be used for injection
  const sanitized = withoutHtml.replace(/[<>'"&]/g, "");
  return sanitized.trim();
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";

  // Remove directory traversal attempts
  let sanitized = filename.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[/\\]/g, "_");

  // Remove reserved names (Windows)
  const reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
  const nameWithoutExt = sanitized.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }

  // Remove special characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, "_");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop();
    const name = sanitized.substring(0, 255 - ext!.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent XSS and open redirect attacks
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  // Remove javascript: and data: protocols
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:")) {
    return "";
  }

  // Only allow http:// and https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "";
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return "";
    }
    return urlObj.toString();
  } catch {
    return "";
  }
}

/**
 * Sanitize JSON object recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[sanitizeText(key)] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

