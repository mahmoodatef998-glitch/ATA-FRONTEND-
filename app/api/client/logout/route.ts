import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear the client token cookie
  response.cookies.delete("client-token");

  return response;
}
















