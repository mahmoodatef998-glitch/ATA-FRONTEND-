import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for polling with automatic cleanup
 * Prevents memory leaks and race conditions
 */
export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Setup polling
  useEffect(() => {
    if (!enabled || interval <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial call
    const execute = async () => {
      if (isMountedRef.current) {
        try {
          await callbackRef.current();
        } catch (error) {
          // Silently handle errors - polling should not break the app
          if (process.env.NODE_ENV === "development") {
            console.debug("Polling error:", error);
          }
        }
      }
    };

    execute();

    // Setup interval
    intervalRef.current = setInterval(execute, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);
}

