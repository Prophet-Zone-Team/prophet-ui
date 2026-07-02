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
import { NativeAppShell } from "@/components/runtime/native-app-shell";
import { ThemeApplier } from "@/components/runtime/theme-applier";
import type { AppLocale } from "@/i18n/config";
import dynamic from "next/dynamic";

const RoadToFinalFloatingPromo = dynamic(
  () => import("@/components/promo/road-to-final-floating-promo"),
  { ssr: false }
);

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
      <ThemeApplier />
      <RainbowProvider cookie={cookie}>
        <AnalyticsProvider>
          <AuthProvider>
            <MigrateProvider>
              <SportsWsProvider>
                <ProphetNotificationWsProvider>
                  <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden font-body">
                    <NativeAppShell />
                    <MobileLoadingScreen />
                    <AppChrome>{children}</AppChrome>
                  </main>
                  <Toaster />
                  <RoadToFinalFloatingPromo />
                </ProphetNotificationWsProvider>
              </SportsWsProvider>
            </MigrateProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </RainbowProvider>
    </LocaleProvider>
  );
}
