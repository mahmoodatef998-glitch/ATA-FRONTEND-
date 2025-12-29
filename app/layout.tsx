import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { RemoveBrowserExtensionAttrs } from "@/components/remove-browser-extension-attrs";
import { Providers } from "@/components/providers";
import { Chatbot } from "@/components/chat/chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATA SYSTEM",
  description: "نظام CRM احترافي مع إدارة طلبات الشراء وعروض الأسعار",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove browser extension attributes before React hydration
                const removeAttrs = () => {
                  try {
                    const elements = document.querySelectorAll('[bis_skin_checked]');
                    elements.forEach(el => {
                      el.removeAttribute('bis_skin_checked');
                    });
                  } catch(e) {
                    // Silently ignore errors
                  }
                };
                
                // Run immediately if DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeAttrs, { once: true });
                } else {
                  removeAttrs();
                }
                
                // Watch for new elements added by browser extensions
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    let shouldRemove = false;
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                        shouldRemove = true;
                      } else if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('bis_skin_checked')) {
                            shouldRemove = true;
                          }
                        });
                      }
                    });
                    if (shouldRemove) {
                      removeAttrs();
                    }
                  });
                  
                  // Start observing when body is available
                  if (document.body) {
                    observer.observe(document.body, {
                      childList: true,
                      subtree: true,
                      attributes: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  } else {
                    document.addEventListener('DOMContentLoaded', () => {
                      if (document.body) {
                        observer.observe(document.body, {
                          childList: true,
                          subtree: true,
                          attributes: true,
                          attributeFilter: ['bis_skin_checked']
                        });
                      }
                    }, { once: true });
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <RemoveBrowserExtensionAttrs />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              {children}
              {/* Global Chatbot - Available on all pages */}
              <Chatbot />
            </ErrorBoundary>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

