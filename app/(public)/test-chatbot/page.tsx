"use client";

import { Chatbot } from "@/components/chat/chatbot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ArrowLeft, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";

export default function TestChatbotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client/portal">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portal
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Chatbot Test Page
              </h1>
              <p className="text-muted-foreground">
                Test the Groq-powered AI assistant
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Setup Complete
              </CardTitle>
              <CardDescription>
                Chatbot is ready to use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Groq API configured
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Rate limiting enabled
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Multi-language support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Test Instructions
              </CardTitle>
              <CardDescription>
                Try these sample questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• "What products do you offer?"</li>
                <li>• "Tell me about generators"</li>
                <li>• "How can I track my order?"</li>
                <li>• "What is ATS?"</li>
                <li>• "ما هي المنتجات المتاحة؟" (Arabic)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Chatbot Features</CardTitle>
            <CardDescription>
              Powered by Groq API (Llama 3.1 70B)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h3 className="font-semibold mb-2">🚀 Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Ultra-fast responses using Groq's inference engine
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h3 className="font-semibold mb-2">💰 Free</h3>
                <p className="text-sm text-muted-foreground">
                  Completely free - no credit card required
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h3 className="font-semibold mb-2">🌍 Multi-language</h3>
                <p className="text-sm text-muted-foreground">
                  Supports Arabic and English automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Look for the chat button in the bottom-right corner</li>
              <li>Click to open the chat window</li>
              <li>Type your question and press Enter or click Send</li>
              <li>The AI will respond in the same language you use</li>
              <li>You can ask about products, orders, or general questions</li>
            </ol>
          </CardContent>
        </Card>

        {/* Chatbot Component */}
        <div className="mt-8">
          <p className="text-center text-muted-foreground mb-4">
            👇 Chatbot appears in the bottom-right corner 👇
          </p>
        </div>
      </div>

      {/* Chatbot Component */}
      <Chatbot />
    </div>
  );
}



