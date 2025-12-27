import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  getCompanyKnowledge,
  getClientOrderHistory,
  formatCompanyKnowledge,
  formatClientOrderHistory,
  getOrderWorkflowInfo,
  getOrderPlacementGuide,
  getTroubleshootingGuide,
} from "@/lib/chatbot/company-knowledge";

/**
 * Chatbot API Route using Groq
 * Enhanced with company knowledge and client order history
 */

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
    let systemPrompt = `You are an expert AI assistant for ATA CRM, a company specializing in generators, ATS (Automatic Transfer Switches), switchgear, and power solutions.

YOUR PRIMARY ROLE:
You are a knowledgeable, helpful, and professional assistant that provides accurate, detailed, and actionable guidance to clients and users.

YOUR CAPABILITIES:
1. PRODUCT INFORMATION:
   - Answer detailed questions about products (generators, ATS, switchgear, spare parts)
   - Provide specifications, features, and use cases
   - Explain product differences and recommendations
   - Guide on product selection based on needs

2. ORDER MANAGEMENT:
   - Help clients track their orders accurately
   - Explain order statuses and stages in detail
   - Guide on what each stage means and what to expect next
   - Provide specific information about client's orders when available

3. ORDER PLACEMENT GUIDANCE:
   - Step-by-step instructions on how to place an order
   - Explain registration and approval process
   - Guide through order creation process
   - Explain quotation and payment workflow

4. TROUBLESHOOTING & PROBLEM SOLVING:
   - Help solve common issues users face
   - Provide specific solutions to problems
   - Guide on how to resolve errors
   - Explain what to do in different scenarios

5. PORTAL USAGE:
   - Guide clients on how to use the client portal
   - Explain features and functionality
   - Help navigate the system
   - Answer questions about account management

6. COMPANY INFORMATION:
   - Provide accurate information from the knowledge base
   - Share contact details and business hours
   - Explain company services and specialties

RESPONSE GUIDELINES:
- Be DETAILED and SPECIFIC - don't give vague answers
- Provide STEP-BY-STEP instructions when explaining processes
- Use EXAMPLES when helpful
- Be PROACTIVE - anticipate follow-up questions
- Be FRIENDLY and PROFESSIONAL
- Always respond in the SAME LANGUAGE the user is using (Arabic or English)
- If you don't know something, admit it and guide them to contact support
- When explaining order stages, explain what happens in each stage and what the client should do next
- When troubleshooting, provide specific actionable steps

IMPORTANT:
- Always use the company knowledge base information when available
- When client has orders, reference their specific order details
- Explain workflows clearly with next steps
- Provide solutions, not just descriptions of problems`;

    // Add company knowledge to system prompt
    if (companyKnowledge) {
      systemPrompt += formatCompanyKnowledge(companyKnowledge);
    }

    // Add client order history to system prompt
    if (clientOrderHistory) {
      systemPrompt += formatClientOrderHistory(clientOrderHistory);
    }

    // Add order workflow information
    systemPrompt += getOrderWorkflowInfo();

    // Add order placement guide
    systemPrompt += getOrderPlacementGuide();

    // Add troubleshooting guide
    systemPrompt += getTroubleshootingGuide();

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
        max_tokens: 1000, // Increased for more detailed responses
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
