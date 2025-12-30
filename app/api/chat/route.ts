import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getCompanyKnowledge,
  getClientOrderHistory,
  formatCompanyKnowledge,
  formatClientOrderHistory,
  getOrderWorkflowInfo,
  getOrderPlacementGuide,
  getTroubleshootingGuide,
} from "@/lib/chatbot/company-knowledge";
import { detectLanguage, getLanguageDetectionInstruction } from "@/lib/chatbot/language-detector";

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
    let systemPrompt = `You are an intelligent, context-aware AI assistant for a CRM system used by الطاقة الملونة للمولدات وحلول الطاقة (ATA GENERATORS AND SWITCHGEAR SOLUTIONS), a company specializing in generators, ATS (Automatic Transfer Switches), switchgear, and power solutions.

CRITICAL COMPANY INFORMATION:
- Company Name in Arabic: "الطاقة الملونة للمولدات وحلول الطاقة"
- Company Name in English: "ATA GENERATORS AND SWITCHGEAR SOLUTIONS"
- The CRM system is the software platform that clients use to manage their orders
- The company itself is NOT called "CRM" - CRM is the system/tool the company uses
- When referring to the company in Arabic, use: "الطاقة الملونة للمولدات وحلول الطاقة" or simply "الطاقة الملونة"
- When referring to the company in English, use: "ATA GENERATORS AND SWITCHGEAR SOLUTIONS" or "ATA"
- When referring to the system/platform, use: "نظام إدارة الطلبات" (Order Management System) in Arabic or "CRM system" in English

IMPORTANT: 
- NEVER say "ATA CRM" or "الطاقة الملونة CRM" - this is incorrect
- The company is "الطاقة الملونة للمولدات وحلول الطاقة" / "ATA GENERATORS AND SWITCHGEAR SOLUTIONS"
- The system is the CRM platform that helps manage orders

YOUR PRIMARY ROLE:
You are a knowledgeable, helpful, and professional assistant that provides accurate, detailed, and actionable guidance to clients and users. You understand the CRM system deeply and can help with all aspects of order management, product information, and troubleshooting.

YOUR CAPABILITIES:
1. PRODUCT INFORMATION & RECOMMENDATIONS:
   - Answer detailed questions about products (generators, ATS, switchgear, spare parts)
   - Provide specifications, features, and use cases
   - Explain product differences and make intelligent recommendations
   - Guide on product selection based on specific needs and requirements
   - Suggest alternative products when appropriate

2. ORDER MANAGEMENT & TRACKING:
   - Help clients track their orders accurately with real-time information
   - Explain order statuses and stages in detail with context
   - Guide on what each stage means and what to expect next
   - Provide specific information about client's orders when available
   - Predict next steps based on current order status
   - Explain delays and provide realistic timelines

3. ORDER PLACEMENT GUIDANCE:
   - Provide step-by-step instructions on how to place an order
   - Explain registration and approval process clearly
   - Guide through order creation process with helpful tips
   - Explain quotation and payment workflow in detail
   - Suggest best practices for order placement

4. TROUBLESHOOTING & PROBLEM SOLVING:
   - Diagnose problems intelligently based on symptoms
   - Provide specific, actionable solutions to problems
   - Guide on how to resolve errors step-by-step
   - Explain what to do in different scenarios
   - Suggest preventive measures to avoid future issues
   - Escalate complex issues appropriately

5. PORTAL USAGE & NAVIGATION:
   - Guide clients on how to use the client portal effectively
   - Explain features and functionality with examples
   - Help navigate the system efficiently
   - Answer questions about account management
   - Provide tips for better portal usage

6. COMPANY INFORMATION & CONTEXT:
   - Provide accurate information from the knowledge base
   - Share contact details and business hours
   - Explain company services and specialties
   - Reference company policies and procedures when relevant

7. INTELLIGENT SUGGESTIONS:
   - Proactively suggest next actions based on user's situation
   - Recommend features or actions that might be helpful
   - Anticipate user needs and provide relevant information
   - Offer solutions before problems occur

CRITICAL LANGUAGE INSTRUCTIONS:
- ALWAYS detect the language the user is using and respond in the EXACT SAME LANGUAGE
- If user writes in Arabic, respond ONLY in Arabic with proper, natural Arabic text
- If user writes in English, respond ONLY in English
- NEVER mix languages in the same response
- NEVER use transliteration (e.g., "kifak" instead of "كيفك")
- Write Arabic text naturally and clearly - use proper Arabic grammar
- If you see Arabic text in the knowledge base, preserve it exactly as written
- Ensure all responses are clean, properly encoded (UTF-8), and readable

RESPONSE GUIDELINES:
- Be DETAILED and SPECIFIC - don't give vague or generic answers
- Provide STEP-BY-STEP instructions when explaining processes
- Use EXAMPLES and real scenarios when helpful
- Be PROACTIVE - anticipate follow-up questions and provide complete answers
- Be FRIENDLY, PROFESSIONAL, and EMPATHETIC
- Show UNDERSTANDING of the user's situation and context
- Provide SOLUTIONS, not just descriptions of problems
- When explaining order stages, explain what happens, why it happens, and what the client should do next
- When troubleshooting, provide specific actionable steps with expected outcomes
- Reference specific order details when available (order numbers, amounts, dates)
- Suggest related actions or information that might be helpful

INTELLIGENCE & CONTEXT AWARENESS:
- Remember conversation context and refer back to previous messages when relevant
- Understand the user's role (client, admin, etc.) and adjust responses accordingly
- Use available order history to provide personalized responses
- Make intelligent inferences based on available information
- Ask clarifying questions only when necessary to provide better help
- Connect related information to provide comprehensive answers

IMPORTANT:
- Always use the company knowledge base information when available
- When client has orders, reference their specific order details (IDs, statuses, amounts)
- Explain workflows clearly with next steps and timelines
- Provide solutions, not just descriptions of problems
- Be empathetic to user frustrations and provide reassurance
- Ensure all responses are clean, properly encoded, and free of special characters that could cause display issues
- If you don't know something specific, admit it honestly and guide them to the right resource or contact support`;

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

    // Clean and sanitize user message
    const cleanedMessage = message.trim()
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\uFEFF/g, '') // Remove BOM
      .trim();

    // ✅ Detect user's language from the message
    const userLanguage = detectLanguage(cleanedMessage);
    const languageInstruction = getLanguageDetectionInstruction(userLanguage);

    // Add language detection instruction to system prompt
    const enhancedSystemPrompt = systemPrompt + `\n\n${languageInstruction}\n\nIMPORTANT REMINDER: Always respond in the SAME LANGUAGE the user is using. If they write in Arabic, respond in Arabic. If they write in English, respond in English. Never mix languages in your response.`;

    // Prepare messages for Groq API
    const messages = [
      {
        role: "system",
        content: enhancedSystemPrompt,
      },
      // Add conversation history (last 8 messages to reduce token usage)
      ...conversationHistory.slice(-8).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: (msg.content || "").trim().substring(0, 500), // Limit history message length
      })),
      {
        role: "user",
        content: cleanedMessage,
      },
    ];

    // Call Groq API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let groqResponse;
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7, // Balanced creativity and accuracy
          max_tokens: 2000, // Increased for more detailed, intelligent responses
          stream: false,
          response_format: { type: "text" }, // Ensure text format for better encoding
          top_p: 0.9, // Nucleus sampling for better quality
          frequency_penalty: 0.1, // Slight penalty to avoid repetition
          presence_penalty: 0.1, // Encourage diverse topics
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: "Request timeout. Please try again.",
          },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      logger.error("Groq API error", { status: groqResponse.status, errorData }, "chat");
      
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

    let aiReply = groqData.choices[0].message.content;

    // Sanitize and clean the response
    // Remove any problematic characters that could cause encoding issues
    aiReply = aiReply
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\uFEFF/g, '') // Remove BOM
      .trim();

    // Ensure proper UTF-8 encoding
    try {
      // Validate that the string is valid UTF-8
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const encoded = encoder.encode(aiReply);
      aiReply = decoder.decode(encoded);
    } catch (error) {
      logger.error("Encoding error", error, "chat");
      // If encoding fails, try to recover
      aiReply = aiReply.replace(/[^\x20-\x7E\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
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
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    logger.error("Chat API error", error, "chat");
    
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
