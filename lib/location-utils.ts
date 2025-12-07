/**
 * Location Utilities
 * Helper functions for location-based features (check-in, tasks, etc.)
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Validate inputs
  if (
    isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2) ||
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180
  ) {
    throw new Error("Invalid coordinates provided");
  }

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 calculateDistance called with:", {
      point1: { lat: lat1, lng: lng1 },
      point2: { lat: lat2, lng: lng2 },
    });
  }

  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("📏 Distance calculated:", {
      distance: `${distance.toFixed(2)}m`,
      distanceKm: `${(distance / 1000).toFixed(4)}km`,
    });
  }

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if location is within allowed radius
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param targetLat Target latitude (company location)
 * @param targetLng Target longitude (company location)
 * @param radiusMeters Allowed radius in meters
 * @param toleranceMeters Optional tolerance buffer in meters (default: 50m for high accuracy GPS)
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number,
  toleranceMeters: number = 50 // Reduced to 50m for higher precision
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  // Add small tolerance buffer to account for minor GPS accuracy variations
  // Reduced tolerance for higher precision location matching
  return distance <= (radiusMeters + toleranceMeters);
}

/**
 * Default office location (fallback if not set in database)
 * Updated to: 25°19'23.2"N 55°28'58.0"E = 25.323110, 55.482778
 */
const DEFAULT_OFFICE_LAT = 25.323110;
const DEFAULT_OFFICE_LNG = 55.482778;

/**
 * Get company location from company settings or default
 * @param companyId Company ID
 * @returns Company location coordinates (always returns a location, uses default if not set)
 */
export async function getCompanyLocation(companyId: number): Promise<{
  lat: number;
  lng: number;
}> {
  const { prisma } = await import("@/lib/prisma");
  
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { 
      id: true,
      officeLat: true,
      officeLng: true,
    },
  });

  // If company has location set, use it
  if (company && company.officeLat !== null && company.officeLng !== null) {
    return {
      lat: company.officeLat,
      lng: company.officeLng,
    };
  }

  // Fallback to default location (should not happen if script was run)
  console.warn(
    `⚠️ Company ${companyId} does not have office location set. Using default location.`
  );
  return {
    lat: DEFAULT_OFFICE_LAT,
    lng: DEFAULT_OFFICE_LNG,
  };
}

