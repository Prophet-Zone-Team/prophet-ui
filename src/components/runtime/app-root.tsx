"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { HttpsRequiredPage } from "@/components/runtime/https-required-page";
import { AnalyticsProvider } from "@/context/analytics";
import { AuthProvider } from "@/context/auth";
import { ProphetNotificationWsProvider } from "@/context/prophet-notification-ws";
import { SportsWsProvider } from "@/context/sports-ws";
import RainbowProvider from "@/context/rainbowkit/provider";
import { AppChrome } from "@/layout/app-chrome";
import { isSecureInBrowser } from "@/lib/runtime/is-secure-app-context";

interface AppRootProps {
  initialSecure: boolean;
  cookie?: string | null;
  children: ReactNode;
}

export function AppRoot({ initialSecure, cookie, children }: AppRootProps) {
  const isSecure =
    typeof window !== "undefined" ? isSecureInBrowser() : initialSecure;

  if (!isSecure) {
    return <HttpsRequiredPage />;
  }

  return (
    <RainbowProvider cookie={cookie}>
      <AnalyticsProvider>
        <AuthProvider>
          <SportsWsProvider>
            <ProphetNotificationWsProvider>
              <main className="min-h-screen overflow-x-hidden font-body">
                <AppChrome>{children}</AppChrome>
              </main>
              <Toaster />
            </ProphetNotificationWsProvider>
          </SportsWsProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </RainbowProvider>
  );
}
