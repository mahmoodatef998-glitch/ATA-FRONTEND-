"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  className?: string;
}

export function Chatbot({ className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! 👋 I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount check
  useEffect(() => {
    setMounted(true);
    // Try to get client ID if user is a client
    fetchClientId();
  }, []);

  // Fetch client ID from session
  const fetchClientId = async () => {
    try {
      const response = await fetch("/api/chat/client-id");
      const data = await response.json();
      if (data.success && data.data.clientId) {
        setClientId(data.data.clientId);
      }
    } catch (error) {
      // Ignore errors - client ID is optional
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Prepare conversation history
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
          clientId: clientId, // Include client ID if available
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add AI response
      const aiMessage: Message = {
        role: "assistant",
        content: data.data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later or contact support.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! 👋 I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      id="chatbot-root"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        pointerEvents: "auto",
      }}
    >
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 99999,
            height: "70px",
            width: "70px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 15px 35px rgba(102, 126, 234, 0.4), 0 5px 15px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            transition: "all 0.4s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15) rotate(10deg)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(102, 126, 234, 0.6), 0 10px 20px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.boxShadow = "0 15px 35px rgba(102, 126, 234, 0.4), 0 5px 15px rgba(0,0,0,0.2)";
          }}
        >
          <MessageCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="w-[350px] h-[480px] flex flex-col shadow-2xl border-0 overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            zIndex: 99999,
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
                  <Bot className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="leading-tight">
                  <CardTitle className="text-sm font-bold">AI Assistant</CardTitle>
                  <p className="text-[10px] text-white/70">Powered by Groq</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChat}
                  className="h-7 w-7 p-0 text-white hover:bg-white/20 backdrop-blur-sm"
                  title="Start New Chat"
                >
                  <span className="text-base">🔄</span>
                </Button>
                
                {/* Close Button - Very Visible */}
                <button
                  onClick={() => {
                    console.log("❌ Close button clicked!");
                    setIsOpen(false);
                  }}
                  className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-2xl"
                  title="✕ إغلاق"
                  style={{
                    border: "2px solid white",
                    boxShadow: "0 4px 15px rgba(220, 38, 38, 0.5)",
                  }}
                >
                  <X className="h-6 w-6 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {message.role === "assistant" && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900">
                      <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <span className={`text-xs mt-2 block ${
                      message.role === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {message.role === "user" && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-gray-200 dark:ring-gray-600">
                      <User className="h-5 w-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-blue-100 dark:ring-blue-900">
                    <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 h-10 px-3 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-center">
                Powered by Groq • Llama 3.3 70B
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
