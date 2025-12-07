"use client";

import { useEffect } from "react";

interface MarkActionViewedProps {
  orderId: number;
  actionType: "quotation" | "payment" | "delivery";
}

/**
 * Client component to mark action items as viewed in localStorage
 * This is used when the client views the order page
 */
export function MarkActionViewed({ orderId, actionType }: MarkActionViewedProps) {
  useEffect(() => {
    const key = `${orderId}_${actionType}`;
    
    // Load existing viewed items
    const stored = localStorage.getItem("client_viewed_action_items");
    let viewedItems: string[] = [];
    
    if (stored) {
      try {
        viewedItems = JSON.parse(stored);
      } catch (e) {
        console.error("Error loading viewed items:", e);
      }
    }
    
    // Add this item if not already viewed
    if (!viewedItems.includes(key)) {
      viewedItems.push(key);
      localStorage.setItem("client_viewed_action_items", JSON.stringify(viewedItems));
    }
  }, [orderId, actionType]);

  return null; // This component doesn't render anything
}

