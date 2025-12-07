"use client";

import { useEffect } from "react";

/**
 * Component to remove browser extension attributes that cause hydration mismatch
 * This fixes the bis_skin_checked attribute added by browser extensions
 */
export function RemoveBrowserExtensionAttrs() {
  useEffect(() => {
    // Remove bis_skin_checked attributes added by browser extensions
    const removeAttributes = () => {
      try {
        document.querySelectorAll("[bis_skin_checked]").forEach((el) => {
          el.removeAttribute("bis_skin_checked");
        });
      } catch (error) {
        // Silently fail if DOM is not ready
        console.debug("Could not remove browser extension attributes:", error);
      }
    };

    // Remove on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(removeAttributes, 0);

    // Watch for new elements added by extensions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (element.hasAttribute("bis_skin_checked")) {
              element.removeAttribute("bis_skin_checked");
            }
            // Remove from all children
            element.querySelectorAll("[bis_skin_checked]").forEach((el) => {
              el.removeAttribute("bis_skin_checked");
            });
          }
        });

        // Also watch for attribute changes
        if (mutation.type === "attributes" && mutation.attributeName === "bis_skin_checked") {
          const target = mutation.target as HTMLElement;
          if (target.hasAttribute("bis_skin_checked")) {
            target.removeAttribute("bis_skin_checked");
          }
        }
      });
    });

    // Observe the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["bis_skin_checked"],
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}

