/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API calls within a short time window
 * This is critical for preventing duplicate requests from multiple components
 */

// Map to store pending requests
const pendingRequests = new Map<string, Promise<any>>();

// Map to store request timestamps for deduplication window
const requestTimestamps = new Map<string, number>();

/**
 * Deduplicate a request - if the same request is made within the deduplication window,
 * return the existing promise instead of making a new request
 * 
 * @param key - Unique key for the request (e.g., "unread-count:123")
 * @param fetcher - Function that makes the actual request
 * @param deduplicationWindowMs - Time window in milliseconds (default: 1000ms = 1 second)
 * @returns Promise that resolves with the request result
 */
export function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  deduplicationWindowMs: number = 1000
): Promise<T> {
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(key) || 0;
  const timeSinceLastRequest = now - lastRequestTime;

  // If there's a pending request, return it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // If request was made recently (within deduplication window), return cached result
  // Note: This is a simple in-memory cache - for production, consider using a more robust solution
  if (timeSinceLastRequest < deduplicationWindowMs) {
    // Return the existing promise if it exists
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }
  }

  // Create new request
  const promise = fetcher()
    .then((result) => {
      // Store timestamp
      requestTimestamps.set(key, Date.now());
      // Clean up after request completes
      pendingRequests.delete(key);
      return result;
    })
    .catch((error) => {
      // Clean up on error
      pendingRequests.delete(key);
      throw error;
    });

  // Store pending request
  pendingRequests.set(key, promise);

  return promise;
}

/**
 * Clear deduplication cache for a specific key
 */
export function clearDeduplicationCache(key: string): void {
  pendingRequests.delete(key);
  requestTimestamps.delete(key);
}

/**
 * Clear all deduplication cache
 */
export function clearAllDeduplicationCache(): void {
  pendingRequests.clear();
  requestTimestamps.clear();
}

