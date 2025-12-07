/**
 * API Client with Error Handling
 * Wraps fetch with automatic error handling and toast notifications
 */

import { useToast } from "@/hooks/use-toast";
import { handleApiError } from "./api-error-handler";

interface FetchOptions extends RequestInit {
  showErrorToast?: boolean;
}

/**
 * Enhanced fetch with automatic error handling
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {},
  toast?: ReturnType<typeof useToast>["toast"]
): Promise<Response> {
  const { showErrorToast = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      if (showErrorToast && toast) {
        handleApiError(errorData, toast);
      }

      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response;
  } catch (error: any) {
    if (showErrorToast && toast) {
      handleApiError(error, toast);
    }
    throw error;
  }
}

/**
 * Hook for API calls with automatic error handling
 */
export function useApiClient() {
  const { toast } = useToast();

  return {
    fetch: (url: string, options: FetchOptions = {}) =>
      apiFetch(url, options, toast),
  };
}


