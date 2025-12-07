import { ValidationError } from '@/lib/error-handler';

/**
 * Validates and parses an ID from route params
 * 
 * @param id - The ID string from params
 * @param resourceName - Name of the resource (e.g., "order", "task", "user")
 * @returns Parsed ID number
 * @throws {ValidationError} If ID is invalid
 * 
 * @example
 * ```typescript
 * const { id } = await params;
 * const orderId = validateId(id, "order");
 * ```
 */
export function validateId(id: string, resourceName: string = "resource"): number {
  const parsedId = parseInt(id);
  
  if (isNaN(parsedId) || parsedId <= 0) {
    throw new ValidationError(
      `Invalid ${resourceName} ID`,
      [{ field: "id", message: `Invalid ${resourceName} ID: ${id}` }]
    );
  }
  
  return parsedId;
}

/**
 * Validates multiple IDs from an array
 * 
 * @param ids - Array of ID strings
 * @param resourceName - Name of the resource
 * @returns Array of parsed ID numbers
 * @throws {ValidationError} If any ID is invalid
 * 
 * @example
 * ```typescript
 * const ids = validateIds(["1", "2", "3"], "user");
 * ```
 */
export function validateIds(ids: string[], resourceName: string = "resource"): number[] {
  return ids.map(id => validateId(id, resourceName));
}

