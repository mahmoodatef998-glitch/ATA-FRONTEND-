"use client";

import { OrderStage } from "@prisma/client";
import { Check, Clock, CheckCircle2 } from "lucide-react";

interface OrderProgressTrackerProps {
  currentStage: OrderStage;
  className?: string;
}

const stages = [
  { key: "RECEIVED", label: "Received", icon: "📨", desc: "Order request received", color: "from-blue-400 to-blue-600" },
  { key: "UNDER_REVIEW", label: "Under Review", icon: "👀", desc: "Reviewing requirements", color: "from-indigo-400 to-indigo-600" },
  { key: "QUOTATION_PREPARATION", label: "Preparing Quote", icon: "📝", desc: "Preparing quotation", color: "from-purple-400 to-purple-600" },
  { key: "QUOTATION_SENT", label: "Quote Sent", icon: "📤", desc: "Quotation sent to client", color: "from-violet-400 to-violet-600" },
  { key: "QUOTATION_ACCEPTED", label: "Quote Accepted", icon: "✅", desc: "Client approved quotation", color: "from-green-400 to-green-600" },
  { key: "PO_PREPARED", label: "PO Prepared", icon: "📄", desc: "Purchase order ready", color: "from-teal-400 to-teal-600" },
  { key: "AWAITING_DEPOSIT", label: "Awaiting Deposit", icon: "💰", desc: "Waiting for deposit payment", color: "from-amber-400 to-amber-600" },
  { key: "DEPOSIT_RECEIVED", label: "Deposit Received", icon: "✔️", desc: "Deposit payment received", color: "from-emerald-400 to-emerald-600" },
  { key: "IN_MANUFACTURING", label: "Manufacturing", icon: "⚙️", desc: "Production in progress", color: "from-orange-400 to-orange-600" },
  { key: "MANUFACTURING_COMPLETE", label: "Manufacturing Done", icon: "✅", desc: "Production completed", color: "from-lime-400 to-lime-600" },
  { key: "READY_FOR_DELIVERY", label: "Ready for Delivery", icon: "📦", desc: "Ready to ship", color: "from-cyan-400 to-cyan-600" },
  { key: "DELIVERY_NOTE_SENT", label: "Delivery Note Sent", icon: "📋", desc: "Delivery note issued", color: "from-sky-400 to-sky-600" },
  { key: "AWAITING_FINAL_PAYMENT", label: "Final Payment Due", icon: "💵", desc: "Waiting for final payment", color: "from-yellow-400 to-yellow-600" },
  { key: "FINAL_PAYMENT_RECEIVED", label: "Payment Complete", icon: "✔️", desc: "Final payment received", color: "from-green-400 to-green-600" },
  { key: "COMPLETED_DELIVERED", label: "Completed", icon: "🎉", desc: "Order completed successfully", color: "from-emerald-500 to-green-600" },
];

export function OrderProgressTracker({ currentStage, className }: OrderProgressTrackerProps) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage);
  const progressPercentage = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className={className}>
      {/* Header with Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Order Progress
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your order from request to delivery
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {Math.round(progressPercentage)}%
            </div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Background Line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full" />
        
        {/* Progress Line - Completed */}
        <div 
          className="absolute left-6 top-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
          style={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        >
          {/* Animated Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400 blur-sm opacity-50 animate-pulse"></div>
        </div>

        {/* Stages */}
        <div className="space-y-8 relative">
          {stages.map((stage, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div 
                key={stage.key} 
                className={`
                  flex items-start gap-5 group transition-all duration-300
                  ${isCurrent ? "scale-105" : ""}
                `}
              >
                {/* Icon Circle */}
                <div className="relative">
                  <div
                    className={`
                      relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-3 transition-all duration-500 shadow-lg
                      ${
                        isCompleted
                          ? `bg-gradient-to-br ${stage.color} border-transparent shadow-xl`
                          : isPending
                          ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          : ""
                      }
                      ${isCurrent ? "ring-4 ring-blue-300 dark:ring-blue-700 ring-offset-2 scale-110 shadow-2xl animate-pulse" : ""}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-7 w-7 text-white drop-shadow-lg" />
                    ) : isCurrent ? (
                      <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
                    ) : (
                      <span className="text-2xl filter grayscale opacity-50">{stage.icon}</span>
                    )}
                  </div>
                  
                  {/* Glow Effect for Current */}
                  {isCurrent && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${stage.color} rounded-full blur-xl opacity-40 animate-pulse`}></div>
                  )}
                </div>

                {/* Stage Info Card */}
                <div 
                  className={`
                    flex-1 pt-2 pb-2 px-4 rounded-lg transition-all duration-300
                    ${isCurrent ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-md" : ""}
                    ${isCompleted && !isCurrent ? "bg-green-50/50 dark:bg-green-950/20" : ""}
                    ${isPending ? "opacity-60" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`
                          font-semibold transition-all text-base
                          ${isCompleted ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}
                          ${isCurrent ? "text-blue-700 dark:text-blue-300 text-lg" : ""}
                        `}
                      >
                        {stage.label}
                      </p>
                      <p className={`
                        text-xs mt-1
                        ${isCurrent ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-500"}
                      `}>
                        {stage.desc}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md animate-pulse">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </span>
                      )}
                      {isCompleted && !isCurrent && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white shadow-sm">
                          <Check className="h-3 w-3" />
                          Done
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-850 rounded-lg border border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Current Stage: <span className="text-blue-600 dark:text-blue-400 font-bold">{stages[currentIndex]?.label}</span>
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {currentIndex + 1} of {stages.length} stages
          </div>
        </div>
      </div>
    </div>
  );
}


