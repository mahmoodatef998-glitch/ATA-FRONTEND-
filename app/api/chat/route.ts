import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/security";
import { handleApiError } from "@/lib/error-handler";

// Load dotenv only in development
if (process.env.NODE_ENV === "development") {
  try {
    const dotenv = require("dotenv");
    dotenv.config();
  } catch (error) {
    // Silently ignore in production
  }
}

/**
 * Chatbot API Route using Groq
 * Handles chat messages and returns AI responses
 */

// GET method for health check
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Chatbot API is running",
      model: "llama-3.3-70b-versatile",
    },
    { status: 200 }
  );
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// POST method for chat
export async function POST(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Debug logging only in development
  if (process.env.NODE_ENV === "development") {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [CHAT API] Environment Check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("process.env.GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Not found");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await rateLimiter.check(
      `chat:${clientIp}`,
      RATE_LIMITS.API_GENERAL.limit,
      RATE_LIMITS.API_GENERAL.windowMs
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.API_GENERAL.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // Check if Groq API key is configured
    const groqApiKey = process.env.GROQ_API_KEY;
    
    // Debug logging only in development
    if (process.env.NODE_ENV === "development" && groqApiKey) {
      console.log("✅ GROQ_API_KEY found, length:", groqApiKey.length);
    }
    
    if (!groqApiKey || groqApiKey.trim() === "") {
      console.error("❌ GROQ_API_KEY is not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is not configured. Please contact support.",
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Sanitize user message
    const sanitizedMessage = sanitizeText(message.trim());

    // Limit message length
    if (sanitizedMessage.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is too long. Maximum 1000 characters.",
        },
        { status: 400 }
      );
    }

    // System prompt for ATA CRM chatbot
    const systemPrompt = `You are a helpful AI assistant for ATA CRM, a company specializing in generators, ATS (Automatic Transfer Switches), switchgear, and power solutions.

Your role is to:
1. Answer questions about products (generators, ATS, switchgear, spare parts)
2. Help clients track their orders
3. Provide information about pricing and specifications
4. Guide clients on how to use the portal
5. Answer general questions about the company

Be friendly, professional, and concise. If you don't know something, politely direct them to contact support.
Always respond in the same language the user is using (Arabic or English).

Company Information:
- Company: ATA CRM
- Products: Diesel Generators, ATS Systems, Switchgear, Spare Parts
- Services: Quotations, Order Management, Technical Support`;

    // Prepare messages for Groq API
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      // Add conversation history (last 10 messages to keep context manageable)
      ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: sanitizedMessage,
      },
    ];

    // Call Groq API
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 [GROQ] Calling Groq API with", messages.length, "messages");
    }
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Latest Llama model (updated Dec 2024)
        messages: messages,
        temperature: 0.7,
        max_tokens: 500, // Limit response length
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("❌ [GROQ] API Error:", groqResponse.status, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    const groqData = await groqResponse.json();

    if (!groqData.choices || !groqData.choices[0] || !groqData.choices[0].message) {
      console.error("❌ [GROQ] Invalid response:", groqData);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from chatbot service.",
        },
        { status: 500 }
      );
    }

    const aiReply = groqData.choices[0].message.content;
    
    if (process.env.NODE_ENV === "development") {
      console.log("✅ [GROQ] Reply received, length:", aiReply?.length || 0);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reply: aiReply,
          model: groqData.model,
          usage: groqData.usage,
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return handleApiError(error);
  }
}

