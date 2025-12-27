"use client";

import { memo } from "react";
import { OrderStage } from "@prisma/client";
import { Check, Clock, ChevronRight } from "lucide-react";

interface OrderProgressTrackerCompactProps {
  currentStage: OrderStage;
  className?: string;
}

const stages = [
  { key: "RECEIVED", label: "Received", shortLabel: "Received", icon: "📨" },
  { key: "UNDER_REVIEW", label: "Review", shortLabel: "Review", icon: "👀" },
  { key: "QUOTATION_PREPARATION", label: "Quote Prep", shortLabel: "Quote", icon: "📝" },
  { key: "QUOTATION_SENT", label: "Quote Sent", shortLabel: "Sent", icon: "📤" },
  { key: "QUOTATION_ACCEPTED", label: "Accepted", shortLabel: "Accepted", icon: "✅" },
  { key: "PO_PREPARED", label: "PO Ready", shortLabel: "PO", icon: "📄" },
  { key: "AWAITING_DEPOSIT", label: "Awaiting Deposit", shortLabel: "Deposit", icon: "💰" },
  { key: "DEPOSIT_RECEIVED", label: "Paid", shortLabel: "Paid", icon: "✔️" },
  { key: "IN_MANUFACTURING", label: "Manufacturing", shortLabel: "Mfg", icon: "⚙️" },
  { key: "MANUFACTURING_COMPLETE", label: "Mfg Done", shortLabel: "Done", icon: "✅" },
  { key: "READY_FOR_DELIVERY", label: "Ready", shortLabel: "Ready", icon: "📦" },
  { key: "DELIVERY_NOTE_SENT", label: "Delivered", shortLabel: "Delivered", icon: "📋" },
  { key: "AWAITING_FINAL_PAYMENT", label: "Final Payment", shortLabel: "Payment", icon: "💵" },
  { key: "FINAL_PAYMENT_RECEIVED", label: "Paid", shortLabel: "Paid", icon: "✔️" },
  { key: "COMPLETED_DELIVERED", label: "Completed", shortLabel: "Done", icon: "🎉" },
];

function OrderProgressTrackerCompactComponent({ currentStage, className }: OrderProgressTrackerCompactProps) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage);
  // Handle case where stage is not found
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progressPercentage = ((safeIndex + 1) / stages.length) * 100;

  // Show only: current stage + 2 before + 2 after
  const visibleRange = 2;
  const startIndex = Math.max(0, safeIndex - visibleRange);
  const endIndex = Math.min(stages.length - 1, safeIndex + visibleRange);
  const visibleStages = stages.slice(startIndex, endIndex + 1);

  return (
    <div className={className}>
      {/* Compact Header with Progress Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Order Progress
            </h3>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Stepper - Only visible stages */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {visibleStages.map((stage, idx) => {
            const actualIndex = startIndex + idx;
            const isCompleted = actualIndex < safeIndex;
            const isCurrent = actualIndex === safeIndex;
            const isPending = actualIndex > safeIndex;
            const isLast = idx === visibleStages.length - 1;

            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`
                      relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                      ${isCompleted
                        ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-lg"
                        : isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500 shadow-xl ring-4 ring-blue-200 dark:ring-blue-800 scale-110"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="h-5 w-5 text-white animate-pulse" />
                    ) : (
                      <span className="text-lg opacity-50">{stage.icon}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`
                        text-xs font-medium whitespace-nowrap
                        ${isCurrent 
                          ? "text-blue-600 dark:text-blue-400 font-bold" 
                          : isCompleted
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-600"
                        }
                      `}
                    >
                      {stage.shortLabel}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 animate-pulse">
                        Current
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 -mt-8">
                    <div
                      className={`
                        h-full rounded transition-all duration-500
                        ${actualIndex < safeIndex
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gray-300 dark:bg-gray-600"
                        }
                      `}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show indicators if there are hidden stages */}
        {startIndex > 0 && (
          <div className="absolute left-0 top-0 -ml-6 flex items-center text-xs text-gray-400">
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>{startIndex} completed</span>
          </div>
        )}
        {endIndex < stages.length - 1 && (
          <div className="absolute right-0 top-0 -mr-6 flex items-center text-xs text-gray-400">
            <span>{stages.length - 1 - endIndex} remaining</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Current Stage Info */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Stage {safeIndex + 1}/{stages.length}: <span className="text-blue-600 dark:text-blue-400 font-bold">{stages[safeIndex]?.label || currentStage}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Full View */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">
          View all {stages.length} stages
        </summary>
        <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className={`
                p-2 rounded border text-center
                ${index <= safeIndex
                  ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500"
                }
              `}
            >
              <div className="font-medium">{stage.icon} {stage.shortLabel}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// Add displayName for better debugging
OrderProgressTrackerCompactComponent.displayName = 'OrderProgressTrackerCompact';

// Export memoized component
export const OrderProgressTrackerCompact = memo(OrderProgressTrackerCompactComponent);








