"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AnalyticsProvider } from "@/context/analytics";
import { AuthProvider } from "@/context/auth";
import { MigrateProvider } from "@/context/migrate";
import { ProphetNotificationWsProvider } from "@/context/prophet-notification-ws";
import { SportsWsProvider } from "@/context/sports-ws";
import RainbowProvider from "@/context/rainbowkit/provider";
import { LocaleProvider } from "@/components/runtime/locale-provider";
import { AppChrome } from "@/layout/app-chrome";
import { MobileLoadingScreen } from "@/components/runtime/mobile-loading-screen";
import type { AppLocale } from "@/i18n/config";

interface AppRootProps {
  initialSecure: boolean;
  cookie?: string | null;
  initialLocale: AppLocale;
  initialMessages: Record<string, unknown>;
  children: ReactNode;
}

export function AppRoot({
  initialSecure,
  cookie,
  initialLocale,
  initialMessages,
  children
}: AppRootProps) {
  return (
    <LocaleProvider
      initialLocale={initialLocale}
      initialMessages={initialMessages}
    >
      <RainbowProvider cookie={cookie}>
        <AnalyticsProvider>
          <AuthProvider>
            <MigrateProvider>
              <SportsWsProvider>
                <ProphetNotificationWsProvider>
                  <main className="min-h-screen overflow-x-hidden font-body">
                    <MobileLoadingScreen />
                    <AppChrome>{children}</AppChrome>
                  </main>
                  <Toaster />
                </ProphetNotificationWsProvider>
              </SportsWsProvider>
            </MigrateProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </RainbowProvider>
    </LocaleProvider>
  );
}
