import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * GET - Get client ID from session token
 * Used by chatbot to include client order history in context
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("client-token")?.value;
    
    if (!token) {
      return NextResponse.json({
        success: true,
        data: { clientId: null },
      });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== "client" || !payload.clientId) {
      return NextResponse.json({
        success: true,
        data: { clientId: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: { clientId: payload.clientId as number },
    });
  } catch (error) {
    // If token is invalid, just return null (not an error)
    return NextResponse.json({
      success: true,
      data: { clientId: null },
    });
  }
}

