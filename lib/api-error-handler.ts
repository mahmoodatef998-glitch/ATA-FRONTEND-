/**
 * API Error Handler
 * Handles API errors and shows appropriate toast messages for permission denials
 */

import { useToast } from "@/hooks/use-toast";

export function handleApiError(error: any, toast?: ReturnType<typeof useToast>["toast"]) {
  const errorMessage = error?.message || error?.error || "An error occurred";
  const status = error?.status || error?.response?.status;

  // Permission denied errors
  if (status === 403 || errorMessage.toLowerCase().includes("permission") || errorMessage.toLowerCase().includes("forbidden")) {
    if (toast) {
      toast({
        title: "Access Denied",
        description: errorMessage || "You don't have permission to perform this action",
        variant: "destructive",
      });
    }
    return;
  }

  // Unauthorized errors
  if (status === 401 || errorMessage.toLowerCase().includes("unauthorized")) {
    if (toast) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
    }
    return;
  }

  // Generic error
  if (toast) {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }
}

/**
 * Hook for handling API errors with toast
 */
export function useApiErrorHandler() {
  const { toast } = useToast();

  return (error: any) => {
    handleApiError(error, toast);
  };
}


