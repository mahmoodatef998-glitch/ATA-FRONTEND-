import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/security";
import { handleApiError } from "@/lib/error-handler";

// Load dotenv to ensure .env is read
try {
  const dotenv = require("dotenv");
  dotenv.config();
  console.log("✅ [INIT] dotenv.config() called in API route");
} catch (error) {
  console.error("❌ [INIT] Error loading dotenv:", error);
}

// Load environment variables manually if needed
let groqApiKeyFromEnv: string | undefined;
try {
  // Try to load from process.env first
  groqApiKeyFromEnv = process.env.GROQ_API_KEY;
  
  console.log("🔍 [INIT] Checking GROQ_API_KEY on module load...");
  console.log("🔍 [INIT] process.env.GROQ_API_KEY:", groqApiKeyFromEnv ? `✅ Found (${groqApiKeyFromEnv.length} chars)` : "❌ Not found");
  
  // If not found, try to load from .env file directly (development only)
  if (!groqApiKeyFromEnv) {
    console.log("🔍 [INIT] Trying to load from .env file...");
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(process.cwd(), ".env");
    console.log("🔍 [INIT] .env path:", envPath);
    console.log("🔍 [INIT] .env exists:", fs.existsSync(envPath));
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      console.log("🔍 [INIT] .env file size:", envContent.length, "chars");
      
      // Try multiple regex patterns
      let match = envContent.match(/^GROQ_API_KEY\s*=\s*(.+)$/m);
      if (!match) {
        match = envContent.match(/GROQ_API_KEY\s*=\s*(.+)/);
      }
      
      if (match) {
        groqApiKeyFromEnv = match[1].trim();
        // Remove quotes if present
        if ((groqApiKeyFromEnv.startsWith('"') && groqApiKeyFromEnv.endsWith('"')) ||
            (groqApiKeyFromEnv.startsWith("'") && groqApiKeyFromEnv.endsWith("'"))) {
          groqApiKeyFromEnv = groqApiKeyFromEnv.slice(1, -1);
        }
        console.log("✅ [INIT] Loaded GROQ_API_KEY from .env file directly");
        console.log("✅ [INIT] Key length:", groqApiKeyFromEnv.length);
        console.log("✅ [INIT] Key starts with:", groqApiKeyFromEnv.substring(0, 15) + "...");
      } else {
        console.log("❌ [INIT] GROQ_API_KEY not found in .env file content");
        console.log("🔍 [INIT] .env content preview:", envContent.substring(0, 200));
      }
    } else {
      console.log("❌ [INIT] .env file does not exist at:", envPath);
    }
  }
} catch (error) {
  console.error("❌ [INIT] Error loading GROQ_API_KEY:", error);
}

/**
 * Chatbot API Route using Groq
 * Handles chat messages and returns AI responses
 */
export async function POST(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Debug: Log all environment variables (only in development)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 [CHAT API] Environment Check:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("groqApiKeyFromEnv:", groqApiKeyFromEnv ? "✅ Found" : "❌ Not found");
  console.log("process.env.GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Not found");
  if (groqApiKeyFromEnv) {
    console.log("GROQ_API_KEY length:", groqApiKeyFromEnv.length);
    console.log("GROQ_API_KEY starts with:", groqApiKeyFromEnv.substring(0, 15) + "...");
  }
  console.log("All GROQ vars:", Object.keys(process.env).filter(k => k.toUpperCase().includes("GROQ")));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
    // Try multiple ways to get the key (for different Next.js versions)
    const groqApiKey = 
      groqApiKeyFromEnv ||
      process.env.GROQ_API_KEY || 
      process.env.NEXT_PUBLIC_GROQ_API_KEY ||
      (process.env as any).GROQ_API_KEY;
    
    // Debug logging
    console.log("🔍 Final GROQ_API_KEY check:");
    console.log("Key exists:", !!groqApiKey);
    console.log("Key length:", groqApiKey?.length || 0);
    if (groqApiKey) {
      console.log("Key starts with:", groqApiKey.substring(0, 15) + "...");
      console.log("✅ Ready to call Groq API");
    } else {
      console.log("❌ GROQ_API_KEY is missing!");
    }
    
    if (!groqApiKey || groqApiKey.trim() === "") {
      console.error("❌ GROQ_API_KEY is not configured");
      console.error("groqApiKeyFromEnv:", groqApiKeyFromEnv);
      console.error("process.env.GROQ_API_KEY:", process.env.GROQ_API_KEY);
      console.error("process.env.NEXT_PUBLIC_GROQ_API_KEY:", process.env.NEXT_PUBLIC_GROQ_API_KEY);
      console.error("Please add GROQ_API_KEY to your .env file and restart the server");
      
      // Try to read .env file one more time
      try {
        const fs = require("fs");
        const path = require("path");
        const envPath = path.join(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf8");
          console.error("📄 .env file content (first 500 chars):", envContent.substring(0, 500));
          const match = envContent.match(/GROQ_API_KEY\s*=\s*(.+)/);
          if (match) {
            console.error("🔍 Found GROQ_API_KEY in .env:", match[1].substring(0, 20) + "...");
          } else {
            console.error("❌ GROQ_API_KEY not found in .env file");
          }
        } else {
          console.error("❌ .env file does not exist at:", envPath);
        }
      } catch (error) {
        console.error("❌ Error reading .env:", error);
      }
      
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is not configured. Please contact support.",
          hint: process.env.NODE_ENV === "development" 
            ? "Make sure GROQ_API_KEY is in .env and server is restarted" 
            : undefined,
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
    console.log("🚀 [GROQ] Preparing to call Groq API...");
    console.log("🚀 [GROQ] API Key exists:", !!groqApiKey);
    console.log("🚀 [GROQ] API Key length:", groqApiKey?.length || 0);
    console.log("🚀 [GROQ] API Key preview:", groqApiKey ? groqApiKey.substring(0, 20) + "..." : "N/A");
    console.log("🚀 [GROQ] Messages count:", messages.length);
    
    if (!groqApiKey) {
      console.error("❌ [GROQ] Cannot call API - key is missing!");
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is not configured. Please contact support.",
        },
        { status: 503 }
      );
    }
    
    console.log("🚀 [GROQ] Calling Groq API...");
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
    
    console.log("🚀 [GROQ] Response status:", groqResponse.status);
    console.log("🚀 [GROQ] Response ok:", groqResponse.ok);

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [GROQ] API Error!");
      console.error("Status:", groqResponse.status);
      console.error("Status Text:", groqResponse.statusText);
      console.error("Error Data:", errorData);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Parse error message if possible
      let errorMessage = "Chatbot service is temporarily unavailable. Please try again later.";
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
          console.error("📝 [GROQ] Error Message:", errorMessage);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? {
            status: groqResponse.status,
            statusText: groqResponse.statusText,
            response: errorData,
          } : undefined,
        },
        { status: 503 }
      );
    }

    const groqData = await groqResponse.json();
    
    console.log("📥 [GROQ] Response received:");
    console.log("📥 [GROQ] Has choices:", !!groqData.choices);
    console.log("📥 [GROQ] Choices length:", groqData.choices?.length || 0);
    console.log("📥 [GROQ] Full response:", JSON.stringify(groqData, null, 2));

    if (!groqData.choices || !groqData.choices[0] || !groqData.choices[0].message) {
      console.error("❌ [GROQ] Invalid Groq API response:", groqData);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from chatbot service.",
          details: process.env.NODE_ENV === "development" ? groqData : undefined,
        },
        { status: 500 }
      );
    }

    const aiReply = groqData.choices[0].message.content;
    console.log("✅ [GROQ] AI Reply:", aiReply);
    console.log("✅ [GROQ] Reply length:", aiReply?.length || 0);

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

