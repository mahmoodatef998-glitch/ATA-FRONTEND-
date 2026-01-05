"use client";

import { useEffect, useState } from "react";

/**
 * ✅ Professional ATA Loading Component
 * 
 * Modern, elegant loading animation with rotating "ATA" text
 * Used throughout the application for consistent loading experience
 */
export function AtaLoader({ 
  size = "default",
  text = "ATA",
  showText = true 
}: { 
  size?: "sm" | "default" | "lg";
  text?: string;
  showText?: boolean;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    default: "h-16 w-16 text-2xl",
    lg: "h-24 w-24 text-4xl",
  };

  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // For small size, use inline flex layout (for buttons)
  if (size === "sm") {
    return (
      <div className="inline-flex items-center justify-center">
        <div className="relative">
          <div 
            className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center animate-spin-slow`}
          >
            {text}
          </div>
          <div 
            className={`absolute inset-0 blur-md opacity-20 font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent`}
            style={{
              animation: 'spin-slow 3s linear infinite reverse',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      {/* Rotating ATA Text with Glow Effect */}
      <div className="relative">
        {/* Main rotating text */}
        <div 
          className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center animate-spin-slow`}
        >
          {text}
        </div>
        
        {/* Glowing effect behind */}
        <div 
          className={`absolute inset-0 blur-xl opacity-30 font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent`}
          style={{
            animation: 'spin-slow 3s linear infinite reverse',
          }}
        >
          {text}
        </div>
      </div>

      {/* Loading text with animated dots */}
      {showText && (
        <div className="text-sm text-muted-foreground font-medium animate-fade-in">
          Loading{dots}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 animate-progress"
          style={{
            animation: 'progress 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

/**
 * ✅ Full Page ATA Loader
 * 
 * Full-screen loading component for page transitions
 */
export function AtaPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-6">
        <AtaLoader size="lg" showText={true} />
        <p 
          className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse"
        >
          ATA Generators & Switchgear Solutions
        </p>
      </div>
    </div>
  );
}

