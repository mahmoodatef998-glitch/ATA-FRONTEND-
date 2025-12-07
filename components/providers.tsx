"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/context";
import { PermissionsProvider } from "@/contexts/permissions-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <I18nProvider>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </I18nProvider>
    </SessionProvider>
  );
}

