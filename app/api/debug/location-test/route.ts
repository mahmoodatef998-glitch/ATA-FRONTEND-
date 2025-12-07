import { NextRequest, NextResponse } from "next/server";
import { calculateDistance, getCompanyLocation } from "@/lib/location-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Debug endpoint to test location calculation
 * GET /api/debug/location-test?lat=25.357529&lng=55.473482
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const testLat = parseFloat(searchParams.get("lat") || "0");
    const testLng = parseFloat(searchParams.get("lng") || "0");

    if (!testLat || !testLng) {
      return NextResponse.json({
        success: false,
        error: "Please provide lat and lng parameters",
        example: "/api/debug/location-test?lat=25.357529&lng=55.473482",
      });
    }

    // Get company location
    const companyLocation = await getCompanyLocation(session.user.companyId);
    
    // Get company settings
    const companySettings = await prisma.company_settings.findUnique({
      where: { companyId: session.user.companyId },
    });

    // Calculate distance
    const distance = calculateDistance(
      testLat,
      testLng,
      companyLocation.lat,
      companyLocation.lng
    );

    // Also test with swapped coordinates (in case they're reversed)
    const distanceSwapped = calculateDistance(
      testLng, // Swapped
      testLat, // Swapped
      companyLocation.lat,
      companyLocation.lng
    );

    return NextResponse.json({
      success: true,
      data: {
        testLocation: {
          lat: testLat,
          lng: testLng,
        },
        companyLocation: {
          lat: companyLocation.lat,
          lng: companyLocation.lng,
        },
        checkInRadius: companySettings?.checkInRadius || 500,
        calculations: {
          normal: {
            distance: distance,
            distanceMeters: `${distance.toFixed(2)}m`,
            distanceKm: `${(distance / 1000).toFixed(4)}km`,
            isWithinRadius: distance <= (companySettings?.checkInRadius || 500),
          },
          swapped: {
            distance: distanceSwapped,
            distanceMeters: `${distanceSwapped.toFixed(2)}m`,
            distanceKm: `${(distanceSwapped / 1000).toFixed(4)}km`,
            isWithinRadius: distanceSwapped <= (companySettings?.checkInRadius || 500),
            note: "This is with lat/lng swapped (in case coordinates are reversed)",
          },
        },
        differences: {
          latDiff: Math.abs(testLat - companyLocation.lat),
          lngDiff: Math.abs(testLng - companyLocation.lng),
          latDiffDegrees: Math.abs(testLat - companyLocation.lat),
          lngDiffDegrees: Math.abs(testLng - companyLocation.lng),
          note: "1 degree ≈ 111km (lat) or 111km * cos(lat) (lng)",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 });
  }
}

