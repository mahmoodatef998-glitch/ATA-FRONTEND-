"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/context";
import { PermissionsProvider } from "@/contexts/permissions-context";
import { ReactQueryProvider } from "@/lib/react-query";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <ReactQueryProvider>
        <I18nProvider>
          <PermissionsProvider>
            {children}
          </PermissionsProvider>
        </I18nProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}

