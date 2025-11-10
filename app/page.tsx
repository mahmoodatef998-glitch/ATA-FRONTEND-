"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Zap, Shield, Clock, CheckCircle, User, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Professional Power Solutions
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              ATA Generators
              <br />
              <span className="text-5xl md:text-6xl">& Power Solutions</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your trusted partner for Generators, ATS, Switchgear & Spare Parts
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { icon: Shield, text: "Certified Quality" },
                { icon: Clock, text: "Fast Delivery" },
                { icon: CheckCircle, text: "24/7 Support" },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <feature.icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Portal Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <Link
              href="/client/login"
              className="group relative p-8 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-950/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-200/50 dark:border-green-900/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-600/0 group-hover:from-green-400/5 group-hover:to-green-600/5 transition-all duration-300"></div>
              
              <div className="relative">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3 flex items-center justify-center gap-2">
                  Client Portal
                  <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                  Request quotations for generators, spare parts & switchgear
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
            
            <Link
              href="/login"
              className="group relative p-8 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-indigo-200/50 dark:border-indigo-900/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-600/0 group-hover:from-indigo-400/5 group-hover:to-indigo-600/5 transition-all duration-300"></div>
              
              <div className="relative">
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center justify-center gap-2">
                  Admin Dashboard
                  <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                  Complete CRM system with PO, payments & delivery tracking
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* How it Works */}
          <div className="max-w-4xl mx-auto p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Register", desc: "Create your account" },
                { step: "2", title: "Request", desc: "Submit specifications" },
                { step: "3", title: "Quotation", desc: "Receive & approve PDF" },
                { step: "4", title: "Track", desc: "Monitor PO & delivery" },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.desc}
                    </p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-700 dark:to-purple-700 -z-10"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 ATA Generators & Parts. Professional Power Solutions.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
