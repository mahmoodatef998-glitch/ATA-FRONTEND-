/**
 * Centralized Error Handling
 * Provides consistent error handling across all API endpoints
 */

import { NextResponse } from "next/server";
import { ApiError, ValidationErrorResponse } from "./types/api";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      404,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden: Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Handle errors and return appropriate API response
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Log error for debugging
  // Use logger if available, otherwise console
  if (typeof window === 'undefined') {
    import("@/lib/logger").then(({ logger }) => {
      logger.error("API Error", error, "api");
    }).catch(() => {
      // Fallback to console if logger fails
      console.error("API Error:", error);
    });
  } else {
    console.error("API Error:", error);
  }

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details:
          process.env.NODE_ENV === "development"
            ? {
                code: error.code,
                details: error.details,
                stack: error.stack,
              }
            : error.code
            ? { code: error.code }
            : undefined,
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: "Database validation error",
        details:
          process.env.NODE_ENV === "development"
            ? { message: error.message }
            : undefined,
      },
      { status: 400 }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes("Unauthorized") || error.message.includes("insufficient permissions")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Insufficient permissions",
          details:
            process.env.NODE_ENV === "development"
              ? { message: error.message, stack: error.stack }
              : undefined,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
        details:
          process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : undefined,
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      success: false,
      error: "An unexpected error occurred",
      details:
        process.env.NODE_ENV === "development"
          ? { message: String(error) }
          : undefined,
    },
    { status: 500 }
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse<ApiError> {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || "field";
      return NextResponse.json(
        {
          success: false,
          error: `A record with this ${field} already exists`,
          details:
            process.env.NODE_ENV === "development"
              ? { code: error.code, target: error.meta?.target }
              : { code: error.code },
        },
        { status: 409 }
      );

    case "P2025":
      // Record not found
      return NextResponse.json(
        {
          success: false,
          error: "Record not found",
          details:
            process.env.NODE_ENV === "development"
              ? { code: error.code, cause: error.meta?.cause }
              : { code: error.code },
        },
        { status: 404 }
      );

    case "P2003":
      // Foreign key constraint violation
      return NextResponse.json(
        {
          success: false,
          error: "Referenced record does not exist",
          details:
            process.env.NODE_ENV === "development"
              ? { code: error.code, field: String(error.meta?.field_name || '') }
              : { code: error.code },
        },
        { status: 400 }
      );

    case "P2014":
      // Required relation violation
      return NextResponse.json(
        {
          success: false,
          error: "Required relation is missing",
          details:
            process.env.NODE_ENV === "development"
              ? { code: error.code, message: String(error.meta?.relation_name || '') }
              : { code: error.code },
        },
        { status: 400 }
      );

    default:
      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred",
          details:
            process.env.NODE_ENV === "development"
              ? {
                  code: error.code,
                  message: error.message,
                  meta: error.meta,
                }
              : { code: error.code },
        },
        { status: 500 }
      );
  }
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>
): NextResponse<ValidationErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      errors,
    },
    { status: 400 }
  );
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

