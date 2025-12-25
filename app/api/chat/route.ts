import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  getCompanyKnowledge,
  getClientOrderHistory,
  formatCompanyKnowledge,
  formatClientOrderHistory,
} from "@/lib/chatbot/company-knowledge";

/**
 * Chatbot API Route using Groq
 * Enhanced with company knowledge and client order history
 */

// Configure runtime for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET method for health check
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Chatbot API is running",
      model: "llama-3.3-70b-versatile",
      groqConfigured: !!process.env.GROQ_API_KEY,
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
  try {
    // Check if Groq API key is configured
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey || groqApiKey.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is not configured.",
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationHistory = [], clientId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    // Limit message length
    if (message.trim().length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is too long. Maximum 1000 characters.",
        },
        { status: 400 }
      );
    }

    // Try to get session (optional - chatbot can work without auth)
    let companyId: number | null = null;
    let clientOrderHistory: any = null;

    try {
      const session = await requireAuth();
      companyId = typeof session.user.companyId === "string" 
        ? parseInt(session.user.companyId) 
        : session.user.companyId;
    } catch (error) {
      // No session - chatbot can still work with default company knowledge
      // Try to get companyId from first company in database
      const firstCompany = await prisma.companies.findFirst({
        select: { id: true },
      });
      companyId = firstCompany?.id || null;
    }

    // Get company knowledge
    let companyKnowledge = null;
    if (companyId) {
      companyKnowledge = await getCompanyKnowledge(companyId);
    }

    // Get client order history if clientId is provided
    if (clientId && typeof clientId === "number") {
      clientOrderHistory = await getClientOrderHistory(clientId);
    }

    // Build enhanced system prompt with company knowledge
    let systemPrompt = `You are a helpful AI assistant for ATA CRM, a company specializing in generators, ATS (Automatic Transfer Switches), switchgear, and power solutions.

Your role is to:
1. Answer questions about products (generators, ATS, switchgear, spare parts)
2. Help clients track their orders
3. Provide information about pricing and specifications
4. Guide clients on how to use the portal
5. Provide accurate information about the company based on the knowledge base

Be friendly, professional, and concise. Always respond in the same language the user is using (Arabic or English).`;

    // Add company knowledge to system prompt
    if (companyKnowledge) {
      systemPrompt += formatCompanyKnowledge(companyKnowledge);
    }

    // Add client order history to system prompt
    if (clientOrderHistory) {
      systemPrompt += formatClientOrderHistory(clientOrderHistory);
    }

    // Prepare messages for Groq API
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      // Add conversation history (last 10 messages)
      ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: message.trim(),
      },
    ];

    // Call Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot service is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const groqData = await groqResponse.json();

    if (!groqData.choices || !groqData.choices[0] || !groqData.choices[0].message) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from chatbot service.",
        },
        { status: 500 }
      );
    }

    const aiReply = groqData.choices[0].message.content;

    return NextResponse.json(
      {
        success: true,
        data: {
          reply: aiReply,
          model: groqData.model,
          usage: groqData.usage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
