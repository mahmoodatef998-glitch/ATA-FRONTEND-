import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ForbiddenError } from '@/lib/error-handler';

/**
 * Handles API errors and returns appropriate HTTP responses
 * 
 * @param error - The error to handle (can be ZodError, ForbiddenError, Error, or unknown)
 * @returns NextResponse with error details
 * 
 * @example
 * ```typescript
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle Forbidden errors (RBAC)
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details,
      },
      { status: 403 }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // User-friendly error messages
    const errorMessages: Record<string, string> = {
      'NetworkError': 'Network error. Please check your connection',
      'TimeoutError': 'Request timed out. Please try again',
      'ValidationError': 'Invalid input. Please check your data',
      'NotFoundError': 'Resource not found',
      'UnauthorizedError': 'Unauthorized. Please login',
    };

    const message = errorMessages[error.name] || error.message;

    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.stack,
          name: error.name,
        }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred. Please try again',
      ...(process.env.NODE_ENV === 'development' && {
        details: String(error),
      }),
    },
    { status: 500 }
  );
}

/**
 * Creates a success response with data
 * 
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success response
 * 
 * @example
 * ```typescript
 * return successResponse({ orders: [] }, 200);
 * ```
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates a paginated response
 * 
 * @param data - The paginated data
 * @param pagination - Pagination metadata
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with paginated response
 * 
 * @example
 * ```typescript
 * return paginatedResponse(orders, {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 *   totalPages: 5,
 * });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
    },
    { status }
  );
}

